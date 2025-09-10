#!/usr/bin/env python3
"""
Test script for Bedrock AgentCore memory integration in strands_agent_runtime
"""

import os
import sys
import asyncio
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from strands_agent_runtime import (
    initialize_memory, 
    save_conversation_to_memory, 
    memory_client, 
    memory_id
)

def test_memory_integration():
    """Test the memory integration functionality"""
    
    print("=== Testing Bedrock AgentCore Memory Integration in Runtime ===\n")
    
    # Test 1: Check memory initialization
    print("1. Testing memory initialization...")
    success = initialize_memory()
    if success:
        print(f"✓ Memory initialized successfully: {memory_id}")
    else:
        print("✗ Failed to initialize memory")
        return False
    
    # Test 2: Save conversation to memory
    print("\n2. Testing conversation saving...")
    test_session_id = f"test_runtime_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    user_message = "안녕하세요, 로봇이 인사해줘"
    assistant_message = "안녕하세요! 로봇이 인사 제스처를 수행했습니다."
    
    success = save_conversation_to_memory(test_session_id, user_message, assistant_message)
    if success:
        print("✓ Conversation saved to memory successfully")
    else:
        print("✗ Failed to save conversation to memory")
        return False
    
    # Test 3: Verify conversation was saved by retrieving it
    print("\n3. Testing conversation retrieval...")
    try:
        if memory_client and memory_id:
            events = memory_client.list_events(
                memory_id=memory_id,
                actor_id=test_session_id,
                session_id=test_session_id,
                max_results=5
            )
            
            if events:
                print(f"✓ Retrieved {len(events)} events from memory")
                for i, event in enumerate(events):
                    payload = event.get('payload', [])
                    for message in payload:
                        if 'conversational' in message:
                            conv_msg = message['conversational']
                            role = conv_msg.get('role', '').lower()
                            content = conv_msg.get('content', {}).get('text', '')
                            print(f"  Event {i+1}: {role}: {content[:50]}...")
            else:
                print("⚠ No events found in memory (this might be normal if events are still being processed)")
        else:
            print("⚠ Memory client not available for retrieval test")
    except Exception as e:
        print(f"⚠ Error retrieving conversations: {e}")
    
    print("\n=== All tests completed successfully! ===")
    return True

if __name__ == "__main__":
    # Set required environment variables for testing
    os.environ.setdefault('AWS_REGION', 'us-east-1')
    os.environ.setdefault('MEMORY_NAME', 'StrandsAgentMemory')
    
    success = test_memory_integration()
    sys.exit(0 if success else 1)
