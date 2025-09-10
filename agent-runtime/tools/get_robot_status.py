from strands import tool
from datetime import datetime
import json
import boto3
import os
from typing import Optional, List, Dict, Any


@tool
def get_robot_status():
    """Get the latest robot status information.

    Args:
        None

    Returns:
        A list of robot status messages with timestamps and status details.
    """
    try:
        # Load configuration
        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.json')
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
        except FileNotFoundError:
            return {"error": f"config.json not found at {config_path}"}
        except json.JSONDecodeError as e:
            return {"error": f"Invalid JSON in config.json: {e}"}
        
        try:
            region = "ap-northeast-2"
            account_id = config['accountId']
        except KeyError as e:
            return {"error": f"Missing required configuration key: {e}"}
        
        # Create SQS client
        try:
            sqs = boto3.client('sqs', region_name=region)
        except Exception as e:
            return {"error": f"Failed to create SQS client: {e}"}
        
        # Construct SQS FIFO queue URL
        queue_url = f"https://sqs.{region}.amazonaws.com/{account_id}/robo_feedback.fifo"
        
        # Check queue access first
        try:
            sqs.get_queue_attributes(QueueUrl=queue_url, AttributeNames=['All'])
        except Exception as e:
            return {"error": f"Cannot access SQS queue: {e}. Please check queue name, AWS credentials, and permissions."}
        
        # Receive messages from SQS (non-blocking)
        try:
            response = sqs.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=0,  # Non-blocking for tool usage
                MessageAttributeNames=['All']
            )
        except Exception as e:
            return {"error": f"Error receiving messages: {e}"}
        
        messages = response.get('Messages', [])
        
        if not messages:
            return {
                "status": "no_messages",
                "message": "No robot status messages available in the queue",
                "timestamp": datetime.now().isoformat()
            }
        
        # Process messages
        robot_status_messages = []
        
        for message in messages:
            try:
                # Parse message body
                message_body = json.loads(message['Body'])
                
                # Extract message attributes
                message_attributes = message.get('MessageAttributes', {})
                
                # Create status message
                status_message = {
                    "message_id": message['MessageId'],
                    "timestamp": datetime.now().isoformat(),
                    "message_body": message_body,
                    "attributes": {
                        attr_name: attr_value['StringValue'] 
                        for attr_name, attr_value in message_attributes.items()
                    }
                }
                
                robot_status_messages.append(status_message)
                
                # Delete message after processing
                try:
                    sqs.delete_message(
                        QueueUrl=queue_url,
                        ReceiptHandle=message['ReceiptHandle']
                    )
                except Exception as e:
                    # Log error but continue processing other messages
                    print(f"Warning: Could not delete message {message['MessageId']}: {e}")
                    
            except json.JSONDecodeError:
                # Handle non-JSON messages
                status_message = {
                    "message_id": message['MessageId'],
                    "timestamp": datetime.now().isoformat(),
                    "message_body": message['Body'],  # Raw message
                    "attributes": {
                        attr_name: attr_value['StringValue'] 
                        for attr_name, attr_value in message.get('MessageAttributes', {}).items()
                    }
                }
                robot_status_messages.append(status_message)
                
                # Delete message after processing
                try:
                    sqs.delete_message(
                        QueueUrl=queue_url,
                        ReceiptHandle=message['ReceiptHandle']
                    )
                except Exception as e:
                    print(f"Warning: Could not delete message {message['MessageId']}: {e}")
        
        return {
            "status": "success",
            "message_count": len(robot_status_messages),
            "timestamp": datetime.now().isoformat(),
            "robot_status_messages": robot_status_messages
        }
        
    except Exception as e:
        return {
            "error": f"Unexpected error in get_robot_status: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
