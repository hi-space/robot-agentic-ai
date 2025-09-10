#!/bin/bash

# Simple local testing script for Lambda functions
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Simple Lambda function testing...${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

echo -e "${YELLOW}Installing dependencies...${NC}"
pip install -r requirements.txt

# Set environment variables for local testing
export CHAT_HISTORY_TABLE="ChatHistory"
export ROBOT_FEEDBACK_TABLE="RobotFeedback"
export ROBOT_FEEDBACK_QUEUE="https://sqs.us-east-1.amazonaws.com/123456789012/robot-feedback-queue"

# Test Chat Suggestions Lambda
echo -e "${BLUE}Testing Chat Suggestions Lambda...${NC}"
cd lambda_functions/chat_suggestions

python3 -c "
import json
import sys
import os
sys.path.append('.')

# Mock event and context
event = {
    'body': json.dumps({'session_id': 'test-session-123', 'limit': 5}),
    'headers': {'Content-Type': 'application/json'},
    'httpMethod': 'POST'
}

class MockContext:
    def __init__(self):
        self.function_name = 'test-chat-suggestions'
        self.function_version = '1'
        self.invoked_function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:test-chat-suggestions'
        self.memory_limit_in_mb = '256'
        self.aws_request_id = 'test-request-id'
        self.log_group_name = '/aws/lambda/test-chat-suggestions'
        self.log_stream_name = '2024/01/01/[\$LATEST]test-stream'
        self.remaining_time_in_millis = 30000

context = MockContext()

# Mock DynamoDB table
import boto3
from moto import mock_dynamodb

@mock_dynamodb
def test_chat_suggestions():
    # Create mock table
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.create_table(
        TableName='ChatHistory',
        KeySchema=[{'AttributeName': 'session_id', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'session_id', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST'
    )
    
    # Add sample data
    table.put_item(Item={
        'session_id': 'test-session-123',
        'messages': [
            {'role': 'user', 'content': '로봇이 인사해줘', 'timestamp': '2024-01-01T10:00:00Z'},
            {'role': 'assistant', 'content': '안녕하세요! 로봇이 인사 제스처를 수행했습니다.', 'timestamp': '2024-01-01T10:00:01Z'}
        ],
        'ttl': 1704110400
    })
    
    # Import and test the function
    from handler import lambda_handler
    result = lambda_handler(event, context)
    
    print('✅ Chat Suggestions Test Result:')
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print()

test_chat_suggestions()
"

cd ../..

# Test Robot Feedback Lambda
echo -e "${BLUE}Testing Robot Feedback Lambda...${NC}"
cd lambda_functions/robot_feedback

python3 -c "
import json
import sys
import os
sys.path.append('.')

# Mock event and context
event = {
    'body': json.dumps({'session_id': 'test-session-123', 'task_id': 'test-task-456', 'limit': 10}),
    'headers': {'Content-Type': 'application/json'},
    'httpMethod': 'POST'
}

class MockContext:
    def __init__(self):
        self.function_name = 'test-robot-feedback'
        self.function_version = '1'
        self.invoked_function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:test-robot-feedback'
        self.memory_limit_in_mb = '256'
        self.aws_request_id = 'test-request-id'
        self.log_group_name = '/aws/lambda/test-robot-feedback'
        self.log_stream_name = '2024/01/01/[\$LATEST]test-stream'
        self.remaining_time_in_millis = 30000

context = MockContext()

# Mock SQS and DynamoDB
import boto3
from moto import mock_dynamodb, mock_sqs

@mock_dynamodb
@mock_sqs
def test_robot_feedback():
    # Create mock DynamoDB table
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.create_table(
        TableName='RobotFeedback',
        KeySchema=[
            {'AttributeName': 'session_id', 'KeyType': 'HASH'},
            {'AttributeName': 'message_id', 'KeyType': 'RANGE'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'session_id', 'AttributeType': 'S'},
            {'AttributeName': 'message_id', 'AttributeType': 'S'}
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    
    # Create mock SQS queue
    sqs = boto3.client('sqs', region_name='us-east-1')
    queue_url = sqs.create_queue(QueueName='robot-feedback-queue')['QueueUrl']
    
    # Add sample message to SQS
    sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps({
            'session_id': 'test-session-123',
            'task_id': 'test-task-456',
            'status': 'completed',
            'message': 'Robot completed the task successfully',
            'timestamp': '2024-01-01T10:00:00Z',
            'robot_data': {'position': 'standing', 'battery': 85},
            'error': None,
            'progress': 100
        }),
        MessageAttributes={
            'session_id': {'StringValue': 'test-session-123', 'DataType': 'String'},
            'task_id': {'StringValue': 'test-task-456', 'DataType': 'String'},
            'status': {'StringValue': 'completed', 'DataType': 'String'},
            'timestamp': {'StringValue': '2024-01-01T10:00:00Z', 'DataType': 'String'}
        }
    )
    
    # Import and test the function
    from handler import lambda_handler
    result = lambda_handler(event, context)
    
    print('✅ Robot Feedback Test Result:')
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print()

test_robot_feedback()
"

cd ../..

# Test IoT to SQS Lambda
echo -e "${BLUE}Testing IoT to SQS Lambda...${NC}"
cd lambda_functions/iot_to_sqs

python3 -c "
import json
import sys
import os
sys.path.append('.')

# Mock event and context
event = {
    'session_id': 'test-session-123',
    'task_id': 'test-task-456',
    'status': 'completed',
    'message': 'Robot completed the task successfully',
    'timestamp': '2024-01-01T10:00:00Z',
    'robot_data': {'position': 'standing', 'battery': 85},
    'error': None,
    'progress': 100
}

class MockContext:
    def __init__(self):
        self.function_name = 'test-iot-to-sqs'
        self.function_version = '1'
        self.invoked_function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:test-iot-to-sqs'
        self.memory_limit_in_mb = '256'
        self.aws_request_id = 'test-request-id'
        self.log_group_name = '/aws/lambda/test-iot-to-sqs'
        self.log_stream_name = '2024/01/01/[\$LATEST]test-stream'
        self.remaining_time_in_millis = 30000

context = MockContext()

# Mock SQS
import boto3
from moto import mock_sqs

@mock_sqs
def test_iot_to_sqs():
    # Create mock SQS queue
    sqs = boto3.client('sqs', region_name='us-east-1')
    queue_url = sqs.create_queue(QueueName='robot-feedback-queue')['QueueUrl']
    
    # Import and test the function
    from handler import lambda_handler
    result = lambda_handler(event, context)
    
    print('✅ IoT to SQS Test Result:')
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # Check if message was sent to SQS
    messages = sqs.receive_message(QueueUrl=queue_url)
    if 'Messages' in messages:
        print('✅ Message sent to SQS successfully!')
        print('SQS Message:', json.dumps(messages['Messages'][0], indent=2, ensure_ascii=False))
    else:
        print('❌ No messages found in SQS')
    print()

test_iot_to_sqs()
"

cd ../..

echo -e "${GREEN}✅ All Lambda function tests completed successfully!${NC}"

# Clean up
deactivate
