#!/usr/bin/env python3
"""
Test script for Bedrock AgentCore memory integration in chat_suggestions
"""

import json
import os
import sys
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from handler import lambda_handler, save_conversation_to_memory, get_memory_id

def test_memory_integration():
    """Test the memory integration functionality"""
    
    print("=== Testing Bedrock AgentCore Memory Integration ===\n")
    
    # Test 1: Check memory initialization
    print("1. Testing memory initialization...")
    memory_id = get_memory_id()
    if memory_id:
        print(f"✓ Memory initialized successfully: {memory_id}")
    else:
        print("✗ Failed to initialize memory")
        return False
    
    # Test 2: Save conversation to memory
    print("\n2. Testing conversation saving...")
    test_session_id = f"test_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    user_message = "안녕하세요, 로봇이 인사해줘"
    assistant_message = "안녕하세요! 로봇이 인사 제스처를 수행했습니다."
    
    success = save_conversation_to_memory(test_session_id, user_message, assistant_message)
    if success:
        print("✓ Conversation saved to memory successfully")
    else:
        print("✗ Failed to save conversation to memory")
        return False
    
    # Test 3: Test chat suggestions with memory
    print("\n3. Testing chat suggestions with memory...")
    
    # Create a test event
    test_event = {
        'body': json.dumps({
            'session_id': test_session_id,
            'limit': 5
        })
    }
    
    # Create a mock context
    class MockContext:
        def __init__(self):
            self.function_name = "test_function"
            self.function_version = "1"
            self.invoked_function_arn = "arn:aws:lambda:us-east-1:123456789012:function:test"
            self.memory_limit_in_mb = 128
            self.remaining_time_in_millis = 30000
            self.log_group_name = "/aws/lambda/test"
            self.log_stream_name = "2024/01/01/[$LATEST]test"
            self.aws_request_id = "test-request-id"
    
    context = MockContext()
    
    try:
        response = lambda_handler(test_event, context)
        
        if response['statusCode'] == 200:
            body = json.loads(response['body'])
            suggestions = body.get('suggestions', [])
            print(f"✓ Chat suggestions generated successfully: {len(suggestions)} suggestions")
            print("Suggestions:")
            for i, suggestion in enumerate(suggestions, 1):
                print(f"  {i}. {suggestion}")
        else:
            print(f"✗ Chat suggestions failed with status {response['statusCode']}")
            print(f"Error: {response.get('body', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"✗ Error testing chat suggestions: {e}")
        return False
    
    print("\n=== All tests completed successfully! ===")
    return True

if __name__ == "__main__":
    # Set required environment variables for testing
    os.environ.setdefault('AWS_REGION', 'us-east-1')
    os.environ.setdefault('MEMORY_NAME', 'ChatSuggestionsMemory')
    
    success = test_memory_integration()
    sys.exit(0 if success else 1)
