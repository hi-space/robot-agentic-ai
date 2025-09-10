import json
import boto3
import logging
import os
from typing import List, Dict, Any
from datetime import datetime
from bedrock_agentcore.memory import MemoryClient

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('CHAT_HISTORY_TABLE', 'ChatHistory')
table = dynamodb.Table(table_name)

# Initialize Bedrock AgentCore Memory client
memory_client = MemoryClient(region_name=os.environ.get('AWS_REGION', 'us-east-1'))
memory_name = os.environ.get('MEMORY_NAME', 'ChatSuggestionsMemory')
memory_id = None

def get_memory_id():
    """Get or create memory ID for chat suggestions"""
    global memory_id
    if memory_id:
        return memory_id
    
    try:
        # Try to get existing memory first
        memories = memory_client.list_memories()
        for memory in memories:
            if memory.get('name') == memory_name:
                memory_id = memory.get('id')
                logger.info(f"Found existing memory: {memory_id}")
                return memory_id
        
        # Create new memory if not found
        memory = memory_client.create_memory(
            name=memory_name,
            description="Memory for storing conversation history for chat suggestions"
        )
        memory_id = memory.get('id')
        logger.info(f"Created new memory: {memory_id}")
        return memory_id
        
    except Exception as e:
        logger.error(f"Error initializing memory: {e}")
        return None

def lambda_handler(event, context):
    """
    Lambda function to get suggested next questions based on chat history
    """
    try:
        # Parse the request
        body = json.loads(event.get('body', '{}'))
        session_id = body.get('session_id')
        limit = body.get('limit', 5)
        
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
        
        # Get chat history from Bedrock AgentCore Memory
        try:
            memory_id = get_memory_id()
            if not memory_id:
                logger.warning("Memory not available, using empty history")
                chat_history = []
            else:
                # Get events from memory
                events = memory_client.list_events(
                    memory_id=memory_id,
                    actor_id=session_id,
                    session_id=session_id,
                    max_results=10
                )
                
                # Convert events to conversation history format
                chat_history = []
                for event in events:
                    payload = event.get('payload', [])
                    for message in payload:
                        if 'conversational' in message:
                            conv_msg = message['conversational']
                            chat_history.append({
                                'role': conv_msg.get('role', '').lower(),
                                'content': conv_msg.get('content', {}).get('text', ''),
                                'timestamp': event.get('created_at', datetime.now().isoformat())
                            })
                
                # Sort by timestamp (oldest first)
                chat_history.sort(key=lambda x: x.get('timestamp', ''))
                logger.info(f"Retrieved {len(chat_history)} messages from memory for session {session_id}")
                
        except Exception as e:
            logger.error(f"Error fetching chat history from memory: {e}")
            # Fallback to DynamoDB if memory fails
            try:
                response = table.get_item(Key={'session_id': session_id})
                chat_history = response.get('Item', {}).get('messages', [])
                logger.info("Fell back to DynamoDB for chat history")
            except Exception as fallback_e:
                logger.error(f"Error fetching chat history from DynamoDB fallback: {fallback_e}")
                chat_history = []
        
        # Generate suggestions based on chat history
        suggestions = generate_suggestions(chat_history, limit)
        
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
                'suggestions': suggestions,
                'timestamp': datetime.now().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Error in chat suggestions lambda: {e}")
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

def save_conversation_to_memory(session_id: str, user_message: str, assistant_message: str) -> bool:
    """
    Save a conversation turn to Bedrock AgentCore memory
    
    Args:
        session_id: Session identifier
        user_message: User's message
        assistant_message: Assistant's response
        
    Returns:
        True if successful, False otherwise
    """
    try:
        memory_id = get_memory_id()
        if not memory_id:
            logger.error("Memory not available for saving conversation")
            return False
        
        # Create event with conversation messages
        memory_client.create_event(
            memory_id=memory_id,
            actor_id=session_id,
            session_id=session_id,
            messages=[
                (user_message, "USER"),
                (assistant_message, "ASSISTANT")
            ]
        )
        
        logger.info(f"Saved conversation event for session {session_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error saving conversation to memory: {e}")
        return False

def generate_suggestions(chat_history: List[Dict], limit: int = 5) -> List[str]:
    """
    Generate suggested next questions based on chat history
    """
    # Default suggestions
    default_suggestions = [
        "로봇이 인사해줘",
        "로봇이 춤춰줘", 
        "로봇이 앞으로 점프해줘",
        "로봇이 앉아줘",
        "로봇이 일어서줘",
        "로봇이 스트레칭 해줘",
        "로봇이 하트 제스처해줘",
        "로봇이 앞으로 구르기해줘",
        "로봇이 균형잡기해줘",
        "로봇이 움직임을 멈춰줘",
        "현재 시간이 몇 시야?",
        "날씨가 어때?",
        "계산기 사용해줘",
        "로봇이 댄스1을 춰줘",
        "로봇이 댄스2를 춰줘"
    ]
    
    if not chat_history:
        return default_suggestions[:limit]
    
    # Analyze recent messages to generate contextual suggestions
    recent_messages = chat_history[-5:]  # Last 5 messages
    suggestions = []
    
    # Check for robot commands in recent history
    robot_commands = [
        "인사", "춤", "점프", "앉", "일어서", "스트레칭", "하트", "구르기", "균형", "멈춰"
    ]
    
    # Check for general questions
    question_words = ["뭐", "어떻게", "언제", "어디", "왜", "누구", "몇"]
    
    # Analyze patterns and generate contextual suggestions
    for message in recent_messages:
        content = message.get('content', '').lower()
        
        # If recent messages contain robot commands, suggest related commands
        if any(cmd in content for cmd in robot_commands):
            if "인사" in content:
                suggestions.extend(["로봇이 하트 제스처해줘", "로봇이 춤춰줘"])
            elif "춤" in content:
                suggestions.extend(["로봇이 댄스1을 춰줘", "로봇이 댄스2를 춰줘"])
            elif "점프" in content:
                suggestions.extend(["로봇이 앞으로 구르기해줘", "로봇이 균형잡기해줘"])
            elif "앉" in content:
                suggestions.extend(["로봇이 일어서줘", "로봇이 스트레칭 해줘"])
        
        # If recent messages contain questions, suggest more questions
        elif any(q in content for q in question_words):
            suggestions.extend(["현재 시간이 몇 시야?", "날씨가 어때?", "계산기 사용해줘"])
    
    # Remove duplicates and limit results
    suggestions = list(dict.fromkeys(suggestions))[:limit]
    
    # If we don't have enough suggestions, add default ones
    if len(suggestions) < limit:
        for suggestion in default_suggestions:
            if suggestion not in suggestions and len(suggestions) < limit:
                suggestions.append(suggestion)
    
    return suggestions[:limit]
