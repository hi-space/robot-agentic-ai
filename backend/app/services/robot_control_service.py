import logging
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from enum import Enum

from app.services.mcp_service import MCPService
from app.models.schemas import RobotCommand, CommandResponse, Task, TaskStatus, TaskType

logger = logging.getLogger(__name__)


class CommandPriority(Enum):
    EMERGENCY = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4


class RobotControlService:
    """
    Service for managing robot control commands and task execution
    Handles command queuing, priority management, and execution monitoring
    """
    
    def __init__(self):
        self.mcp_service = MCPService()
        self.command_queue: List[Dict[str, Any]] = []
        self.active_commands: Dict[str, Dict[str, Any]] = {}
        self.command_history: List[Dict[str, Any]] = []
        self.robot_status: Dict[str, Any] = {}
        self.is_emergency_stop = False
        
    async def execute_command(
        self,
        command: str,
        parameters: Optional[Dict[str, Any]] = None,
        priority: int = CommandPriority.NORMAL.value,
        session_id: Optional[str] = None,
        timeout: Optional[int] = None
    ) -> CommandResponse:
        """
        Execute a robot command with priority and timeout management
        
        Args:
            command: Command to execute
            parameters: Command parameters
            priority: Command priority (1-4, lower is higher priority)
            session_id: Session identifier
            timeout: Command timeout in seconds
            
        Returns:
            Command execution result
        """
        try:
            # Check for emergency stop
            if self.is_emergency_stop and command != "emergency_stop":
                return CommandResponse(
                    success=False,
                    message="로봇이 비상 정지 상태입니다. emergency_stop 명령으로 해제하세요.",
                    data={"emergency_stop": True}
                )
            
            # Create command object
            robot_command = RobotCommand(
                command=command,
                parameters=parameters or {},
                priority=priority,
                timeout=timeout
            )
            
            # Handle emergency stop
            if command == "emergency_stop":
                return await self._handle_emergency_stop()
            
            # Add to command queue
            command_id = f"cmd_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
            queued_command = {
                "id": command_id,
                "command": robot_command,
                "session_id": session_id,
                "queued_at": datetime.now(),
                "status": "queued"
            }
            
            self.command_queue.append(queued_command)
            
            # Sort queue by priority
            self.command_queue.sort(key=lambda x: x["command"].priority)
            
            # Execute command
            result = await self._execute_queued_command(queued_command)
            
            # Add to history
            self.command_history.append({
                **queued_command,
                "executed_at": datetime.now(),
                "result": result.dict()
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Error executing command '{command}': {e}")
            return CommandResponse(
                success=False,
                message=f"명령 실행 중 오류가 발생했습니다: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _execute_queued_command(self, queued_command: Dict[str, Any]) -> CommandResponse:
        """Execute a queued command"""
        command_id = queued_command["id"]
        robot_command = queued_command["command"]
        
        try:
            # Mark as executing
            queued_command["status"] = "executing"
            self.active_commands[command_id] = queued_command
            
            # Remove from queue
            self.command_queue.remove(queued_command)
            
            # Execute through MCP
            mcp_result = await self.mcp_service.execute_command(
                command=robot_command.command,
                parameters=robot_command.parameters,
                session_id=queued_command.get("session_id")
            )
            
            # Update command status
            queued_command["status"] = "completed" if mcp_result["success"] else "failed"
            queued_command["mcp_result"] = mcp_result
            
            # Remove from active commands
            if command_id in self.active_commands:
                del self.active_commands[command_id]
            
            return CommandResponse(
                success=mcp_result["success"],
                message=mcp_result.get("result", {}).get("message", "명령이 실행되었습니다."),
                data=mcp_result.get("result", {})
            )
            
        except asyncio.TimeoutError:
            logger.warning(f"Command '{robot_command.command}' timed out")
            queued_command["status"] = "timeout"
            return CommandResponse(
                success=False,
                message=f"명령이 시간 초과되었습니다: {robot_command.command}",
                data={"timeout": True}
            )
        except Exception as e:
            logger.error(f"Error executing queued command: {e}")
            queued_command["status"] = "error"
            return CommandResponse(
                success=False,
                message=f"명령 실행 중 오류가 발생했습니다: {str(e)}",
                data={"error": str(e)}
            )
        finally:
            # Clean up
            if command_id in self.active_commands:
                del self.active_commands[command_id]
    
    async def _handle_emergency_stop(self) -> CommandResponse:
        """Handle emergency stop command"""
        try:
            # Stop all active commands
            for command_id in list(self.active_commands.keys()):
                await self._cancel_command(command_id)
            
            # Clear command queue
            self.command_queue.clear()
            
            # Set emergency stop flag
            self.is_emergency_stop = True
            
            # Execute emergency stop through MCP
            mcp_result = await self.mcp_service.execute_command(
                command="emergency_stop",
                parameters={}
            )
            
            return CommandResponse(
                success=True,
                message="비상 정지가 실행되었습니다.",
                data={"emergency_stop": True, "mcp_result": mcp_result}
            )
            
        except Exception as e:
            logger.error(f"Error in emergency stop: {e}")
            return CommandResponse(
                success=False,
                message=f"비상 정지 실행 중 오류가 발생했습니다: {str(e)}",
                data={"error": str(e)}
            )
    
    async def resume_operation(self) -> CommandResponse:
        """Resume robot operation after emergency stop"""
        try:
            self.is_emergency_stop = False
            
            # Execute resume command through MCP
            mcp_result = await self.mcp_service.execute_command(
                command="resume_operation",
                parameters={}
            )
            
            return CommandResponse(
                success=True,
                message="로봇 운영이 재개되었습니다.",
                data={"resumed": True, "mcp_result": mcp_result}
            )
            
        except Exception as e:
            logger.error(f"Error resuming operation: {e}")
            return CommandResponse(
                success=False,
                message=f"운영 재개 중 오류가 발생했습니다: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _cancel_command(self, command_id: str) -> bool:
        """Cancel a specific command"""
        try:
            # Cancel through MCP if command is active
            if command_id in self.active_commands:
                await self.mcp_service.execute_command(
                    command="cancel_command",
                    parameters={"command_id": command_id}
                )
            
            # Remove from queue and active commands
            self.command_queue = [cmd for cmd in self.command_queue if cmd["id"] != command_id]
            if command_id in self.active_commands:
                del self.active_commands[command_id]
            
            return True
            
        except Exception as e:
            logger.error(f"Error canceling command {command_id}: {e}")
            return False
    
    async def get_command_status(self, command_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific command"""
        # Check in active commands
        if command_id in self.active_commands:
            return self.active_commands[command_id]
        
        # Check in history
        for cmd in self.command_history:
            if cmd["id"] == command_id:
                return cmd
        
        return None
    
    async def get_queue_status(self) -> Dict[str, Any]:
        """Get current command queue status"""
        return {
            "queue_length": len(self.command_queue),
            "active_commands": len(self.active_commands),
            "is_emergency_stop": self.is_emergency_stop,
            "queued_commands": [
                {
                    "id": cmd["id"],
                    "command": cmd["command"].command,
                    "priority": cmd["command"].priority,
                    "queued_at": cmd["queued_at"].isoformat()
                }
                for cmd in self.command_queue
            ],
            "active_command_ids": list(self.active_commands.keys())
        }
    
    async def get_robot_status(self) -> Dict[str, Any]:
        """Get current robot status"""
        try:
            # Get status from MCP
            mcp_status = await self.mcp_service.get_robot_status()
            
            # Combine with local status
            self.robot_status = {
                **mcp_status,
                "is_emergency_stop": self.is_emergency_stop,
                "queue_length": len(self.command_queue),
                "active_commands": len(self.active_commands),
                "last_updated": datetime.now().isoformat()
            }
            
            return self.robot_status
            
        except Exception as e:
            logger.error(f"Error getting robot status: {e}")
            return {
                "status": "unknown",
                "error": str(e),
                "is_emergency_stop": self.is_emergency_stop,
                "last_updated": datetime.now().isoformat()
            }
    
    async def clear_command_history(self, older_than_hours: int = 24) -> int:
        """Clear old command history"""
        cutoff_time = datetime.now() - timedelta(hours=older_than_hours)
        
        original_count = len(self.command_history)
        self.command_history = [
            cmd for cmd in self.command_history
            if cmd.get("executed_at", datetime.min) > cutoff_time
        ]
        
        cleared_count = original_count - len(self.command_history)
        logger.info(f"Cleared {cleared_count} old commands from history")
        
        return cleared_count
    
    async def health_check(self) -> Dict[str, Any]:
        """Check robot control service health"""
        try:
            mcp_health = await self.mcp_service.health_check()
            
            return {
                "status": "healthy" if mcp_health["status"] == "healthy" else "degraded",
                "mcp_service": mcp_health,
                "queue_length": len(self.command_queue),
                "active_commands": len(self.active_commands),
                "is_emergency_stop": self.is_emergency_stop,
                "history_length": len(self.command_history)
            }
            
        except Exception as e:
            logger.error(f"Robot control service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }
