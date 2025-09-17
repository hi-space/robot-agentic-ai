from strands import tool
from datetime import datetime
import json
import boto3
import os
from typing import Optional, List, Dict, Any


def _get_fifo_messages(queue_name: str, config: dict) -> Dict[str, Any]:
    """Helper function to get messages from SQS FIFO queue.
    
    Args:
        queue_name: Name of the FIFO queue (without .fifo suffix)
        config: Configuration dictionary containing accountId
        
    Returns:
        Dictionary containing status and messages
    """
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
    queue_url = f"https://sqs.{region}.amazonaws.com/{account_id}/{queue_name}.fifo"
    
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
            "message": f"No messages available in the {queue_name} queue",
            "timestamp": datetime.now().isoformat()
        }
    
    # Process messages
    processed_messages = []
    
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
            
            processed_messages.append(status_message)
            
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
            processed_messages.append(status_message)
            
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
        "message_count": len(processed_messages),
        "timestamp": datetime.now().isoformat(),
        "messages": processed_messages
    }


@tool
def get_robot_feedback():
    """Get the latest robot feedback information from robo_feedback.fifo.
    This tool retrieves feedback about robot actions and command execution results.

    Args:
        None

    Returns:
        A list of robot feedback messages with timestamps and execution details.
    """
    try:
        # Load configuration
        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config', 'config.json')
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
        except FileNotFoundError:
            return {"error": f"config.json not found at {config_path}"}
        except json.JSONDecodeError as e:
            return {"error": f"Invalid JSON in config.json: {e}"}
        
        # Use helper function to get messages
        result = _get_fifo_messages("robo_feedback", config)
        
        if "error" in result:
            return result
        
        # Rename messages to robot_feedback_messages for clarity
        if "messages" in result:
            result["robot_feedback_messages"] = result.pop("messages")
        
        return result
        
    except Exception as e:
        return {
            "error": f"Unexpected error in get_robot_feedback: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }


@tool
def get_robot_detection():
    """Get the latest robot detection information from robo_detection.fifo.

    Args:
        None

    Returns:
        A list of robot detection messages with timestamps and detection details.
    """
    try:
        # Load configuration
        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config', 'config.json')
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
        except FileNotFoundError:
            return {"error": f"config.json not found at {config_path}"}
        except json.JSONDecodeError as e:
            return {"error": f"Invalid JSON in config.json: {e}"}
        
        # Use helper function to get messages
        result = _get_fifo_messages("robo_detection", config)
        
        if "error" in result:
            return result
        
        # Rename messages to robot_detection_messages
        if "messages" in result:
            result["robot_detection_messages"] = result.pop("messages")
        
        return result
        
    except Exception as e:
        return {
            "error": f"Unexpected error in get_robot_detection: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }


@tool
def get_robot_gesture():
    """Get the latest robot gesture information from robo_gesture.fifo.

    Args:
        None

    Returns:
        A list of robot gesture messages with timestamps and gesture details.
    """
    try:
        # Load configuration
        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config', 'config.json')
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
        except FileNotFoundError:
            return {"error": f"config.json not found at {config_path}"}
        except json.JSONDecodeError as e:
            return {"error": f"Invalid JSON in config.json: {e}"}
        
        # Use helper function to get messages
        result = _get_fifo_messages("robo_gesture", config)
        
        if "error" in result:
            return result
        
        # Rename messages to robot_gesture_messages
        if "messages" in result:
            result["robot_gesture_messages"] = result.pop("messages")
        
        return result
        
    except Exception as e:
        return {
            "error": f"Unexpected error in get_robot_gesture: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
