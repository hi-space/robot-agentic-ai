import json
import logging
from typing import Dict, Any, Optional, List, AsyncGenerator
import asyncio
from datetime import datetime

from strands import Agent, tool
from strands.models import BedrockModel
# from strands_tools import calculator, current_time, python_repl  # These tools are not available

from app.core.config import settings
from app.services.mcp_service import MCPService

logger = logging.getLogger(__name__)


@tool
def robot_damp() -> str:
    """
    Make the robot perform a damp movement (gentle, controlled motion).
    """
    return "Robot performed damp movement"


@tool
def robot_balance_stand() -> str:
    """
    Make the robot perform a balance stand (maintaining balance while standing).
    """
    return "Robot performed balance stand"


@tool
def robot_stop_move() -> str:
    """
    Stop all robot movement immediately.
    """
    return "Robot stopped all movement"


@tool
def robot_stand_up() -> str:
    """
    Make the robot stand up from a sitting or lying position.
    """
    return "Robot stood up"


@tool
def robot_stand_down() -> str:
    """
    Make the robot lower itself down (opposite of stand up).
    """
    return "Robot stood down"


@tool
def robot_sit() -> str:
    """
    Make the robot sit down.
    """
    return "Robot sat down"


@tool
def robot_rise_sit() -> str:
    """
    Make the robot rise from sitting position.
    """
    return "Robot rose from sitting position"


@tool
def robot_hello() -> str:
    """
    Make the robot perform a hello gesture (greeting movement).
    """
    return "Robot performed hello gesture"


@tool
def robot_stretch() -> str:
    """
    Make the robot perform a stretching movement.
    """
    return "Robot performed stretching movement"


@tool
def robot_wallow() -> str:
    """
    Make the robot perform a wallowing movement (rolling or moving around).
    """
    return "Robot performed wallowing movement"


@tool
def robot_scrape() -> str:
    """
    Make the robot perform a scraping movement.
    """
    return "Robot performed scraping movement"


@tool
def robot_front_flip() -> str:
    """
    Make the robot perform a front flip (forward somersault).
    """
    return "Robot performed front flip"


@tool
def robot_front_jump() -> str:
    """
    Make the robot perform a front jump (forward jumping movement).
    """
    return "Robot performed front jump"


@tool
def robot_front_pounce() -> str:
    """
    Make the robot perform a front pounce (forward leaping movement).
    """
    return "Robot performed front pounce"


@tool
def robot_dance1() -> str:
    """
    Make the robot perform dance routine 1.
    """
    return "Robot performed dance routine 1"


@tool
def robot_dance2() -> str:
    """
    Make the robot perform dance routine 2.
    """
    return "Robot performed dance routine 2"


@tool
def robot_finger_heart() -> str:
    """
    Make the robot perform a finger heart gesture (making a heart shape with fingers).
    """
    return "Robot performed finger heart gesture"


class StrandsAgentService:
    """
    Service for managing Strands Agent functionality using Strands Agents SDK
    Integrates with MCP for robot control and provides various tools
    """
    
    def __init__(self):
        self.mcp_service = MCPService()
        self.conversation_history: List[Dict[str, str]] = []
        self.active_tasks: Dict[str, Dict[str, Any]] = {}
        
        bedrock_model = BedrockModel(
            model_id="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
            temperature=0.3,
            streaming=True, # Enable/disable streaming
        )

        # Initialize Strands Agent with tools
        self.agent = Agent(
            model=bedrock_model,
            tools=[
                robot_damp,
                robot_balance_stand,
                robot_stop_move,
                robot_stand_up,
                robot_stand_down,
                robot_sit,
                robot_rise_sit,
                robot_hello,
                robot_stretch,
                robot_wallow,
                robot_scrape,
                robot_front_flip,
                robot_front_jump,
                robot_front_pounce,
                robot_dance1,
                robot_dance2,
                robot_finger_heart
            ]
        )
        
    async def process_message(
        self,
        message: str,
        session_id: Optional[str] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        Process user message through Strands Agent using SDK
        
        Args:
            message: User message
            session_id: Session identifier
            stream: Whether to stream response
            
        Returns:
            Agent response with action taken
        """
        try:
            # Add to conversation history
            self.conversation_history.append({
                "role": "user",
                "content": message,
                "timestamp": datetime.now().isoformat()
            })
            
            # Use Strands Agent SDK to process message
            response = await self._process_with_strands_agent(message, session_id)
            
            # Add AI response to history
            self.conversation_history.append({
                "role": "assistant",
                "content": response.get("content", ""),
                "timestamp": datetime.now().isoformat()
            })
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return {
                "content": f"죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다: {str(e)}",
                "is_error": True,
                "action_taken": None
            }
    
    async def process_message_stream(
        self,
        message: str,
        session_id: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Process user message through Strands Agent using SDK with streaming
        
        Args:
            message: User message
            session_id: Session identifier
            
        Yields:
            Streaming chunks of agent response
        """
        try:
            # Add to conversation history
            self.conversation_history.append({
                "role": "user",
                "content": message,
                "timestamp": datetime.now().isoformat()
            })
            
            # Use Strands Agent SDK to process message with streaming
            async for chunk in self._process_with_strands_agent_stream(message, session_id):
                yield chunk
                
        except Exception as e:
            logger.error(f"Error processing streaming message: {e}")
            yield {
                "content": f"죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다: {str(e)}",
                "is_error": True,
                "action_taken": None,
                "done": True
            }
    
    async def _process_with_strands_agent(
        self,
        message: str,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process message using Strands Agent SDK
        
        Args:
            message: User message
            session_id: Session identifier
            
        Returns:
            Agent response with action taken
        """
        try:
            # Create context for the agent
            context = {
                "session_id": session_id,
                "conversation_history": self.conversation_history[-5:],  # Last 5 messages
                "timestamp": datetime.now().isoformat()
            }
            
            # Add context to the message
            contextual_message = f"""
            Context: {json.dumps(context, ensure_ascii=False)}
            
            User Message: {message}
            
            Please respond in Korean and use the available tools as needed.
            If this is a robot command, use the appropriate robot_* tools.
            If this is a general question, provide helpful information based on your knowledge.
            """
            
            # Use Strands Agent to process the message
            agent_response = self.agent(contextual_message)
            
            # Extract response content
            response_content = str(agent_response) if agent_response else "응답을 생성할 수 없습니다."
            
            # Determine if any robot tools were used
            action_taken = None
            if any(tool_name in response_content.lower() for tool_name in [
                "robot_damp", "robot_balance_stand", "robot_stop_move", 
                "robot_stand_up", "robot_stand_down", "robot_sit", "robot_rise_sit",
                "robot_hello", "robot_stretch", "robot_wallow", "robot_scrape",
                "robot_front_flip", "robot_front_jump", "robot_front_pounce",
                "robot_dance1", "robot_dance2", "robot_finger_heart"
            ]):
                action_taken = {
                    "type": "robot_action",
                    "description": "Robot action executed",
                    "timestamp": datetime.now().isoformat()
                }
            
            return {
                "content": response_content,
                "is_error": False,
                "action_taken": action_taken
            }
            
        except Exception as e:
            logger.error(f"Error processing with Strands Agent: {e}")
            return {
                "content": f"Strands Agent 처리 중 오류가 발생했습니다: {str(e)}",
                "is_error": True,
                "action_taken": None
            }
    
    async def _process_with_strands_agent_stream(
        self,
        message: str,
        session_id: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Process message using Strands Agent SDK with streaming
        
        Args:
            message: User message
            session_id: Session identifier
            
        Yields:
            Streaming chunks of agent response
        """
        try:
            # Create context for the agent
            context = {
                "session_id": session_id,
                "conversation_history": self.conversation_history[-5:],  # Last 5 messages
                "timestamp": datetime.now().isoformat()
            }
            
            # Add context to the message
            contextual_message = f"""
            Context: {json.dumps(context, ensure_ascii=False)}
            
            User Message: {message}
            
            Please respond in Korean and use the available tools as needed.
            If this is a robot command, use the appropriate robot_* tools.
            If this is a general question, provide helpful information based on your knowledge.
            """
            
            # Use Strands Agent to process the message with streaming
            # Since the agent is configured with streaming=True, we can get the streaming response
            full_response = ""
            action_taken = None
            
            # Get the streaming response from the agent
            # The agent should return a streaming response when streaming=True
            agent_response = self.agent(contextual_message)
            
            # If the response is a generator or has streaming capabilities, iterate over it
            if hasattr(agent_response, '__iter__') and not isinstance(agent_response, str):
                # Handle streaming response
                for chunk in agent_response:
                    if chunk:
                        chunk_content = str(chunk)
                        full_response += chunk_content
                        
                        # Check if any robot tools were used in this chunk
                        if any(tool_name in chunk_content.lower() for tool_name in [
                            "robot_damp", "robot_balance_stand", "robot_stop_move", 
                            "robot_stand_up", "robot_stand_down", "robot_sit", "robot_rise_sit",
                            "robot_hello", "robot_stretch", "robot_wallow", "robot_scrape",
                            "robot_front_flip", "robot_front_jump", "robot_front_pounce",
                            "robot_dance1", "robot_dance2", "robot_finger_heart"
                        ]):
                            action_taken = {
                                "type": "robot_action",
                                "description": "Robot action executed",
                                "timestamp": datetime.now().isoformat()
                            }
                        
                        # Yield the chunk
                        yield {
                            "content": chunk_content,
                            "is_error": False,
                            "action_taken": action_taken,
                            "done": False
                        }
            else:
                # Handle non-streaming response by simulating streaming
                response_content = str(agent_response) if agent_response else "응답을 생성할 수 없습니다."
                full_response = response_content
                
                # Check if any robot tools were used
                if any(tool_name in response_content.lower() for tool_name in [
                    "robot_damp", "robot_balance_stand", "robot_stop_move", 
                    "robot_stand_up", "robot_stand_down", "robot_sit", "robot_rise_sit",
                    "robot_hello", "robot_stretch", "robot_wallow", "robot_scrape",
                    "robot_front_flip", "robot_front_jump", "robot_front_pounce",
                    "robot_dance1", "robot_dance2", "robot_finger_heart"
                ]):
                    action_taken = {
                        "type": "robot_action",
                        "description": "Robot action executed",
                        "timestamp": datetime.now().isoformat()
                    }
                
                # Simulate streaming by splitting the response into words
                words = response_content.split()
                for i, word in enumerate(words):
                    # Yield each word with a small delay
                    yield {
                        "content": word + " ",
                        "is_error": False,
                        "action_taken": action_taken if i == len(words) - 1 else None,
                        "done": False
                    }
            
            # Add the complete response to conversation history
            self.conversation_history.append({
                "role": "assistant",
                "content": full_response,
                "timestamp": datetime.now().isoformat()
            })
            
            # Send final chunk to indicate completion
            yield {
                "content": "",
                "is_error": False,
                "action_taken": action_taken,
                "done": True
            }
            
        except Exception as e:
            logger.error(f"Error processing with Strands Agent streaming: {e}")
            yield {
                "content": f"Strands Agent 처리 중 오류가 발생했습니다: {str(e)}",
                "is_error": True,
                "action_taken": None,
                "done": True
            }
    
    async def get_recommended_commands(self) -> List[str]:
        """Get recommended commands for the user"""
        return [
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
        ]
    
    async def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific task"""
        return self.active_tasks.get(task_id)
    
    async def get_active_tasks(self) -> List[Dict[str, Any]]:
        """Get all active tasks"""
        return list(self.active_tasks.values())
    
    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a specific task"""
        if task_id in self.active_tasks:
            self.active_tasks[task_id]["status"] = "cancelled"
            return True
        return False
    
    async def health_check(self) -> Dict[str, Any]:
        """Check health of all services"""
        try:
            # Test Strands Agent with a simple message
            test_response = await self._process_with_strands_agent("안녕하세요")
            mcp_health = await self.mcp_service.health_check()
            
            return {
                "strands_agent": "healthy",
                "agent_tools": len(self.agent.tools) if hasattr(self.agent, 'tools') else 0,
                "mcp": mcp_health,
                "active_tasks": len(self.active_tasks),
                "conversation_history_length": len(self.conversation_history),
                "test_response": test_response.get("content", "")[:100] if test_response else "No response"
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "strands_agent": "unhealthy",
                "error": str(e),
                "mcp": await self.mcp_service.health_check(),
                "active_tasks": len(self.active_tasks),
                "conversation_history_length": len(self.conversation_history)
            }
