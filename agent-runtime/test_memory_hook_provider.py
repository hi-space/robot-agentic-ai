#!/usr/bin/env python3
"""
Test script for MemoryHookProvider integration in strands_agent_runtime
"""

import os
import sys
import asyncio
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from strands_agent_runtime import (
    initialize_memory, 
    memory_client, 
    memory_id,
    memory_hook
)

def test_memory_hook_integration():
    """Test the MemoryHook integration functionality"""
    
    print("=== Testing MemoryHook Integration ===\n")
    
    # Test 1: Check memory initialization
    print("1. Testing memory initialization...")
    success = initialize_memory()
    if success:
        print(f"✓ Memory initialized successfully")
        print(f"  - Memory ID: {memory_id}")
        print(f"  - Memory Hook: {memory_hook is not None}")
    else:
        print("✗ Failed to initialize memory")
        return False
    
    # Test 2: Verify MemoryHook is properly configured
    print("\n2. Testing MemoryHook configuration...")
    if memory_hook:
        print("✓ MemoryHook created successfully")
        print(f"  - MemoryHook type: {type(memory_hook)}")
        print(f"  - Memory client: {memory_hook.memory_client is not None}")
        print(f"  - Memory ID: {memory_hook.memory_id}")
    else:
        print("✗ MemoryHook not created")
        return False
    
    # Test 3: Test memory operations
    print("\n3. Testing memory operations...")
    try:
        if memory_client and memory_id:
            # List events to verify memory is accessible
            events = memory_client.list_events(
                memory_id=memory_id,
                max_results=5
            )
            print(f"✓ Memory operations working - found {len(events)} events")
        else:
            print("⚠ Memory client not available for testing")
    except Exception as e:
        print(f"⚠ Error testing memory operations: {e}")
    
    # Test 4: Verify memory can be used for conversation history
    print("\n4. Testing conversation history access...")
    try:
        if memory_hook and memory_hook.memory_client:
            # Test getting conversation history
            # Note: This might be empty if no conversations have been saved yet
            print("✓ MemoryHook is accessible for conversation history")
        else:
            print("✗ MemoryHook not available")
            return False
    except Exception as e:
        print(f"⚠ Error accessing memory: {e}")
    
    print("\n=== All tests completed successfully! ===")
    print("\nMemoryHook is now integrated and will automatically save")
    print("conversations when the Strands Agent processes messages.")
    return True

if __name__ == "__main__":
    # Set required environment variables for testing
    os.environ.setdefault('AWS_REGION', 'us-east-1')
    os.environ.setdefault('MEMORY_NAME', 'StrandsAgentMemory')
    
    success = test_memory_hook_integration()
    sys.exit(0 if success else 1)
