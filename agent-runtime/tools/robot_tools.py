from strands import tool
from datetime import datetime
import json
import boto3
import os
from typing import Optional, List, Dict, Any
from utils.s3_util import download_image_from_s3


def _get_fifo_messages(queue_name: str, config: dict) -> Dict[str, Any]:
    """Helper function to get messages from SQS FIFO queue.
    Reads only the latest 3 messages, filters out messages older than 3 minutes,
    and clears the queue after processing.
    
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
    
    # Get current timestamp for filtering
    current_time = datetime.now()
    three_minutes_ago = current_time.timestamp() - (3 * 60)  # 3 minutes in seconds
    
    # Receive only the latest 3 messages from SQS
    try:
        response = sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=3,  # Changed from 10 to 3
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
            "timestamp": current_time.isoformat()
        }
    
    # Process messages and filter by timestamp
    processed_messages = []
    messages_to_delete = []  # Track all messages for deletion
    
    for message in messages:
        try:
            # Parse message body
            message_body = json.loads(message['Body'])
            
            # Check if message has a timestamp and filter by 3-minute rule
            message_timestamp = None
            if isinstance(message_body, dict) and 'timestamp' in message_body:
                try:
                    # Parse timestamp from message
                    message_timestamp = datetime.fromisoformat(str(message_body['timestamp']).replace('Z', '+00:00'))
                    message_timestamp_seconds = message_timestamp.timestamp()
                    
                    # Skip message if it's older than 3 minutes
                    if message_timestamp_seconds < three_minutes_ago:
                        print(f"Skipping message {message['MessageId']} - older than 3 minutes")
                        # Still add to deletion list to clear the queue
                        messages_to_delete.append(message)
                        continue

                except (ValueError, TypeError) as e:
                    print(f"Warning: Could not parse timestamp from message {message['MessageId']}: {e}")
                    # Continue processing if timestamp parsing fails
            
            # Add message_id to the original message format
            message_body["message_id"] = message['MessageId']
            processed_messages.append(message_body)
            messages_to_delete.append(message)
                
        except json.JSONDecodeError:
            # Handle non-JSON messages - add message_id to raw message
            raw_message = {
                "message_id": message['MessageId'],
                "raw_body": message['Body']
            }
            processed_messages.append(raw_message)
            messages_to_delete.append(message)
    
    # Delete all processed messages to clear the queue
    for message in messages_to_delete:
        try:
            sqs.delete_message(
                QueueUrl=queue_url,
                ReceiptHandle=message['ReceiptHandle']
            )
        except Exception as e:
            print(f"Warning: Could not delete message {message['MessageId']}: {e}")
    
    # Clear any remaining messages in the queue
    try:
        while True:
            response = sqs.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=0
            )
            remaining_messages = response.get('Messages', [])
            if not remaining_messages:
                break
            
            # Delete remaining messages
            for message in remaining_messages:
                try:
                    sqs.delete_message(
                        QueueUrl=queue_url,
                        ReceiptHandle=message['ReceiptHandle']
                    )
                except Exception as e:
                    print(f"Warning: Could not delete remaining message {message['MessageId']}: {e}")
    except Exception as e:
        print(f"Warning: Error clearing remaining messages: {e}")
    
    return {
        "status": "success",
        "message_count": len(processed_messages),
        "timestamp": current_time.isoformat(),
        "messages": processed_messages
    }


@tool
def get_robot_feedback():
    """Get the latest robot feedback information.
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
        
        return result
        
    except Exception as e:
        return {
            "error": f"Unexpected error in get_robot_feedback: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }


@tool
def get_robot_detection():
    """Get the latest robot detection information.
    This tool retrieves emergency situation detection data including emergency_situation, explosion, fire, person_down 
    and the S3 path of the detected image file.

    Args:
        None

    Returns:
        A list of robot detection messages with timestamps, detection details, and S3 image paths.
        Detection types include: emergency_situation, explosion, fire, person_down
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
        
        return result
        
    except Exception as e:
        return {
            "error": f"Unexpected error in get_robot_detection: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }


@tool
def get_robot_gesture():
    """Get the latest robot gesture information.
    This tool retrieves human gesture recognition data including what gesture the detected person is making
    and the S3 path of the gesture image file.

    Args:
        None

    Returns:
        A list of robot gesture messages with timestamps, gesture details, and S3 image paths.
        Contains information about recognized human gestures and corresponding image files.
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
        
        return result
        
    except Exception as e:
        return {
            "error": f"Unexpected error in get_robot_gesture: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }


@tool
def analyze_robot_image(image_path: str) -> str:
    """Analyze a specific robot image from S3 using Bedrock Converse API.
    
    Args:
        image_path: S3 path to the image to analyze
        
    Returns:
        Analysis result of the image
    """
    try:        
        # Download image from S3
        image_bytes = download_image_from_s3(image_path)
                
        # Initialize Bedrock client
        bedrock = boto3.client('bedrock-runtime', region_name='us-west-2')
        
        # Prepare the message for Bedrock Converse API
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "text": "보이는 이미지에 대한 내용을 설명하세요. 감지된 객체, 환경의 물리적 상태, 시각적으로 확인되는 요소들을 객관적으로 분석해주세요."
                    },
                    {
                        "image": {
                            "format": "png",
                            "source": {
                                "bytes": image_bytes
                            }
                        }
                    }
                ]
            }
        ]
        
        # Call Bedrock Converse API
        response = bedrock.converse(
            modelId="us.amazon.nova-lite-v1:0",
            messages=messages,
        )
        
        # Extract the response text
        if 'output' in response and 'message' in response['output']:
            content = response['output']['message']['content']
            if isinstance(content, list) and len(content) > 0:
                return content[0]['text']
            elif isinstance(content, str):
                return content
        
        return "이미지 분석 결과를 가져올 수 없습니다."
        
    except Exception as e:
        return f"Error analyzing image {image_path}: {str(e)}"



def extract_image_path_from_data(data_json: str, data_type: str = "detection") -> str:
    """Extract S3 image path from detection or gesture data JSON string.
    
    Args:
        data_json: JSON string containing detection or gesture data
        data_type: Type of data ("detection" or "gesture")
        
    Returns:
        S3 image path if found, error message otherwise
    """
    try:
        data = json.loads(data_json)
        
        # Determine the message key based on data type
        message_key = f"robot_{data_type}_messages"
        
        if message_key in data:
            for message in data[message_key]:
                # Check message_body for filename (S3 path)
                message_body = message.get("message_body", {})
                if isinstance(message_body, dict) and "filename" in message_body:
                    return message_body["filename"]
                    
        return f"No image path found in {data_type} data"
    except Exception as e:
        return f"Error extracting image path from {data_type} data: {str(e)}"


