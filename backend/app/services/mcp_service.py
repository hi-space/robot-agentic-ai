import json
import logging
import asyncio
from typing import Dict, Any, Optional, List
import httpx
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)


class MCPService:
    """
    Service for interacting with MCP (Model Context Protocol) server
    Handles robot control commands and device interactions
    """
    
    def __init__(self):
        self.base_url = settings.mcp_server_url
        self.timeout = settings.mcp_timeout
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize HTTP client for MCP communication"""
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Robot-Agentic-AI/1.0"
            }
        )
    
    async def get_available_commands(self) -> List[str]:
        """
        Get list of available robot commands from MCP server
        
        Returns:
            List of available command names
        """
        try:
            response = await self.client.get("/api/commands")
            response.raise_for_status()
            
            data = response.json()
            return data.get("commands", [])
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error getting available commands: {e}")
            # Return default commands if MCP server is unavailable
            return self._get_default_commands()
        except Exception as e:
            logger.error(f"Error getting available commands: {e}")
            return self._get_default_commands()
    
    def _get_default_commands(self) -> List[str]:
        """Get default robot commands when MCP server is unavailable"""
        return [
            "move_forward",
            "move_backward", 
            "move_left",
            "move_right",
            "turn_left",
            "turn_right",
            "stop",
            "pick_up",
            "put_down",
            "open_gripper",
            "close_gripper",
            "get_status",
            "go_home",
            "emergency_stop"
        ]
    
    async def execute_command(
        self,
        command: str,
        parameters: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute a robot command through MCP server
        
        Args:
            command: Command name to execute
            parameters: Command parameters
            session_id: Session identifier
            
        Returns:
            Execution result
        """
        try:
            payload = {
                "command": command,
                "parameters": parameters or {},
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            }
            
            response = await self.client.post(
                "/api/execute",
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Log command execution
            logger.info(f"Executed command '{command}' with parameters: {parameters}")
            
            return {
                "success": True,
                "command": command,
                "result": result,
                "timestamp": datetime.now().isoformat()
            }
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error executing command '{command}': {e}")
            return {
                "success": False,
                "command": command,
                "error": f"HTTP error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error executing command '{command}': {e}")
            return {
                "success": False,
                "command": command,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def get_robot_status(self) -> Dict[str, Any]:
        """
        Get current robot status from MCP server
        
        Returns:
            Robot status information
        """
        try:
            response = await self.client.get("/api/status")
            response.raise_for_status()
            
            return response.json()
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error getting robot status: {e}")
            return {
                "status": "unknown",
                "error": f"HTTP error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting robot status: {e}")
            return {
                "status": "unknown",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def get_device_info(self, device_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get device information from MCP server
        
        Args:
            device_id: Specific device ID, or None for all devices
            
        Returns:
            Device information
        """
        try:
            url = f"/api/devices/{device_id}" if device_id else "/api/devices"
            response = await self.client.get(url)
            response.raise_for_status()
            
            return response.json()
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error getting device info: {e}")
            return {
                "devices": [],
                "error": f"HTTP error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting device info: {e}")
            return {
                "devices": [],
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def subscribe_to_events(
        self,
        event_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Subscribe to robot events through MCP server
        
        Args:
            event_types: List of event types to subscribe to
            
        Returns:
            Subscription result
        """
        try:
            payload = {
                "event_types": event_types or ["status_change", "command_completed", "error"],
                "timestamp": datetime.now().isoformat()
            }
            
            response = await self.client.post(
                "/api/events/subscribe",
                json=payload
            )
            response.raise_for_status()
            
            return response.json()
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error subscribing to events: {e}")
            return {
                "success": False,
                "error": f"HTTP error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error subscribing to events: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def health_check(self) -> Dict[str, str]:
        """
        Check MCP server health
        
        Returns:
            Health status
        """
        try:
            response = await self.client.get("/api/health")
            response.raise_for_status()
            
            data = response.json()
            return {
                "status": "healthy",
                "mcp_server": data.get("status", "unknown"),
                "url": self.base_url
            }
            
        except httpx.HTTPError as e:
            logger.error(f"MCP server health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": f"HTTP error: {str(e)}",
                "url": self.base_url
            }
        except Exception as e:
            logger.error(f"MCP server health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "url": self.base_url
            }
    
    async def close(self):
        """Close the HTTP client"""
        if self.client:
            await self.client.aclose()
