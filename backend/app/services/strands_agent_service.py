import json
import logging
from typing import Dict, Any, Optional, List, AsyncGenerator
import asyncio
from datetime import datetime

from app.core.config import settings
from app.services.strands_bedrock_service import StrandsBedrockService
from app.services.mcp_service import MCPService

logger = logging.getLogger(__name__)


class StrandsAgentService:
    """
    Service for managing Strands Agent functionality
    Integrates with Bedrock Claude and MCP for robot control
    """
    
    def __init__(self):
        self.bedrock_service = StrandsBedrockService()
        self.mcp_service = MCPService()
        self.conversation_history: List[Dict[str, str]] = []
        self.active_tasks: Dict[str, Dict[str, Any]] = {}
        
    async def process_message(
        self,
        message: str,
        session_id: Optional[str] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        Process user message through Strands Agent
        
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
            
            # Determine if this is a robot command
            is_robot_command = await self._is_robot_command(message)
            
            if is_robot_command:
                # Process as robot command
                response = await self._process_robot_command(message, session_id)
            else:
                # Process as general conversation
                response = await self._process_general_conversation(message, stream)
            
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
    
    async def _is_robot_command(self, message: str) -> bool:
        """Determine if message is a robot command"""
        robot_keywords = [
            "이동", "움직여", "가", "와", "돌아", "회전", "정지", "멈춰",
            "들어", "내려", "올려", "잡아", "놓아", "열어", "닫아",
            "로봇", "제어", "명령", "실행", "동작"
        ]
        
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in robot_keywords)
    
    async def _process_robot_command(
        self,
        message: str,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process robot command through MCP"""
        try:
            # Get available robot commands from MCP
            available_commands = await self.mcp_service.get_available_commands()
            
            # Generate command using Strands Bedrock
            command_data = await self.bedrock_service.generate_robot_command(
                user_input=message,
                available_commands=available_commands,
                context={"session_id": session_id}
            )
            
            if command_data.get("command") == "error":
                return {
                    "content": f"명령을 이해할 수 없습니다: {command_data.get('explanation', '알 수 없는 오류')}",
                    "is_error": True,
                    "action_taken": None
                }
            
            # Execute command through Strands Bedrock (MCP integrated)
            execution_result = await self.bedrock_service.execute_robot_command(
                command=command_data["command"],
                parameters=command_data.get("parameters", {})
            )
            
            # Create task for tracking
            task_id = f"task_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            self.active_tasks[task_id] = {
                "command": command_data["command"],
                "parameters": command_data.get("parameters", {}),
                "status": "in_progress",
                "created_at": datetime.now().isoformat(),
                "execution_result": execution_result
            }
            
            if execution_result.get("success", False):
                return {
                    "content": f"로봇 명령을 실행했습니다: {command_data.get('explanation', '명령 실행')}",
                    "is_error": False,
                    "action_taken": {
                        "type": "robot_command",
                        "command": command_data["command"],
                        "task_id": task_id,
                        "result": execution_result
                    }
                }
            else:
                return {
                    "content": f"로봇 명령 실행에 실패했습니다: {execution_result.get('message', '알 수 없는 오류')}",
                    "is_error": True,
                    "action_taken": {
                        "type": "robot_command_failed",
                        "command": command_data["command"],
                        "task_id": task_id,
                        "result": execution_result
                    }
                }
                
        except Exception as e:
            logger.error(f"Error processing robot command: {e}")
            return {
                "content": f"로봇 명령 처리 중 오류가 발생했습니다: {str(e)}",
                "is_error": True,
                "action_taken": None
            }
    
    async def _process_general_conversation(
        self,
        message: str,
        stream: bool = False
    ) -> Dict[str, Any]:
        """Process general conversation"""
        try:
            response = await self.bedrock_service.generate_response(
                message=message,
                conversation_history=self.conversation_history[-10:],  # Last 10 messages
                stream=stream
            )
            
            return {
                "content": response,
                "is_error": False,
                "action_taken": None
            }
            
        except Exception as e:
            logger.error(f"Error processing general conversation: {e}")
            return {
                "content": f"대화 처리 중 오류가 발생했습니다: {str(e)}",
                "is_error": True,
                "action_taken": None
            }
    
    async def get_recommended_commands(self) -> List[str]:
        """Get recommended commands for the user"""
        return [
            "로봇을 앞으로 이동시켜줘",
            "로봇을 오른쪽으로 회전시켜줘",
            "로봇을 정지시켜줘",
            "오늘 날씨는 어때?",
            "할 일 목록을 만들어줘",
            "이메일을 작성해줘",
            "일정을 확인해줘",
            "뉴스를 요약해줘"
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
        bedrock_health = await self.bedrock_service.health_check()
        mcp_health = await self.mcp_service.health_check()
        
        return {
            "strands_agent": "healthy",
            "bedrock": bedrock_health,
            "mcp": mcp_health,
            "active_tasks": len(self.active_tasks),
            "conversation_history_length": len(self.conversation_history)
        }
