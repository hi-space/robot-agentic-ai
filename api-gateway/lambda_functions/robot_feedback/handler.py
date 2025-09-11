import json
import boto3
import logging
import os
from typing import Dict, Any, List
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
sqs = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb')
feedback_table_name = os.environ.get('ROBOT_FEEDBACK_TABLE', 'RobotFeedback')
feedback_table = dynamodb.Table(feedback_table_name)

def lambda_handler(event, context):
    """
    Lambda function to get robot feedback from SQS
    """
    try:
        # Parse the request
        body = json.loads(event.get('body', '{}'))
        session_id = body.get('session_id')
        task_id = body.get('task_id')
        limit = body.get('limit', 10)
        
        if not session_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps({
                    'error': 'session_id is required'
                })
            }
        
        # Get feedback from SQS
        feedback_messages = get_feedback_from_sqs(session_id, task_id, limit)
        
        # Store feedback in DynamoDB for persistence
        if feedback_messages:
            store_feedback_in_dynamodb(session_id, feedback_messages)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'session_id': session_id,
                'task_id': task_id,
                'feedback': feedback_messages,
                'count': len(feedback_messages),
                'timestamp': datetime.now().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Error in robot feedback lambda: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def get_feedback_from_sqs(session_id: str, task_id: str = None, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get robot feedback messages from SQS queue
    """
    try:
        # Get SQS queue URL from environment variable
        queue_url = os.environ.get('ROBOT_FEEDBACK_QUEUE', 
            f"https://sqs.{context.invoked_function_arn.split(':')[3]}.amazonaws.com/{context.invoked_function_arn.split(':')[4]}/robot-feedback-queue")
        
        feedback_messages = []
        messages_received = 0
        
        while messages_received < limit:
            # Receive messages from SQS
            response = sqs.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=min(10, limit - messages_received),
                WaitTimeSeconds=1,  # Short polling
                MessageAttributeNames=['All']
            )
            
            messages = response.get('Messages', [])
            if not messages:
                break
            
            for message in messages:
                try:
                    # Parse message body
                    message_body = json.loads(message['Body'])
                    
                    # Filter by session_id and task_id if provided
                    if message_body.get('session_id') == session_id:
                        if not task_id or message_body.get('task_id') == task_id:
                            feedback_data = {
                                'message_id': message['MessageId'],
                                'receipt_handle': message['ReceiptHandle'],
                                'session_id': message_body.get('session_id'),
                                'task_id': message_body.get('task_id'),
                                'status': message_body.get('status'),
                                'message': message_body.get('message'),
                                'timestamp': message_body.get('timestamp'),
                                'robot_data': message_body.get('robot_data', {}),
                                'error': message_body.get('error'),
                                'progress': message_body.get('progress', 0)
                            }
                            feedback_messages.append(feedback_data)
                            messages_received += 1
                            
                            # Delete message from queue after processing
                            sqs.delete_message(
                                QueueUrl=queue_url,
                                ReceiptHandle=message['ReceiptHandle']
                            )
                            
                            if messages_received >= limit:
                                break
                
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing message body: {e}")
                    continue
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    continue
        
        return feedback_messages
        
    except Exception as e:
        logger.error(f"Error getting feedback from SQS: {e}")
        return []

def store_feedback_in_dynamodb(session_id: str, feedback_messages: List[Dict[str, Any]]):
    """
    Store feedback messages in DynamoDB for persistence
    """
    try:
        for feedback in feedback_messages:
            item = {
                'session_id': session_id,
                'message_id': feedback['message_id'],
                'task_id': feedback.get('task_id', 'unknown'),
                'status': feedback.get('status', 'unknown'),
                'message': feedback.get('message', ''),
                'timestamp': feedback.get('timestamp', datetime.now().isoformat()),
                'robot_data': feedback.get('robot_data', {}),
                'error': feedback.get('error'),
                'progress': feedback.get('progress', 0),
                'ttl': int((datetime.now().timestamp() + 86400 * 7))  # 7 days TTL
            }
            
            feedback_table.put_item(Item=item)
            
    except Exception as e:
        logger.error(f"Error storing feedback in DynamoDB: {e}")

def get_historical_feedback(session_id: str, task_id: str = None, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get historical feedback from DynamoDB
    """
    try:
        if task_id:
            response = feedback_table.query(
                KeyConditionExpression='session_id = :session_id AND task_id = :task_id',
                ExpressionAttributeValues={
                    ':session_id': session_id,
                    ':task_id': task_id
                },
                ScanIndexForward=False,  # Most recent first
                Limit=limit
            )
        else:
            response = feedback_table.query(
                KeyConditionExpression='session_id = :session_id',
                ExpressionAttributeValues={
                    ':session_id': session_id
                },
                ScanIndexForward=False,  # Most recent first
                Limit=limit
            )
        
        return response.get('Items', [])
        
    except Exception as e:
        logger.error(f"Error getting historical feedback: {e}")
        return []
