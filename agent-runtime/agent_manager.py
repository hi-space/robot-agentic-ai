import logging
from typing import Optional, Any
from strands import Agent
from strands.models import BedrockModel
from config import Config
from mcp_manager import MCPServerManager


class AgentManager:
    """Manages Strands Agent initialization and lifecycle"""
    
    def __init__(self, config: Config, mcp_manager: MCPServerManager):
        self.config = config
        self.mcp_manager = mcp_manager
        self.logger = logging.getLogger(__name__)
        self.agent: Optional[Agent] = None
        self.mcp_client: Optional[Any] = None
    
    def initialize(self) -> bool:
        """Initialize the agent with MCP tools"""
        try:
            self.logger.info("Starting agent initialization...")
            
            # Load tools from MCP server
            tools, mcp_client = self.mcp_manager.load_tools()
            if not tools or not mcp_client:
                self.logger.error("Failed to load tools from MCP server")
                return False
            
            # Create the agent
            if self._create_agent(tools):
                self.mcp_client = mcp_client
                self.logger.info("Agent initialized successfully")
                return True
            else:
                return False
                
        except Exception as e:
            self.logger.error(f"Error initializing agent: {str(e)}", exc_info=True)
            return False
    
    def _create_agent(self, tools: list) -> bool:
        """Create Strands Agent with the provided tools"""
        try:
            self.logger.info("Creating Strands Agent with tools...")
            
            model = BedrockModel(model_id=self.config.model_id)
            
            self.agent = Agent(
                model=model,
                tools=tools,
                system_prompt="""당신은 사용자 요청에 따라 로봇에게 행동을 지시합니다.
                항상 적절한 도구를 선택해 사용하고, 최종적으로는 사용자가 이해하기 쉽게 현재 상황을 설명해줘.
                """
            )
            
            self.logger.info("Agent created successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Error creating agent: {str(e)}", exc_info=True)
            return False
    
    def is_initialized(self) -> bool:
        """Check if agent is properly initialized"""
        return self.agent is not None and self.mcp_client is not None
    
    def get_agent(self) -> Optional[Agent]:
        """Get the initialized agent"""
        return self.agent
    
    def get_mcp_client(self) -> Optional[Any]:
        """Get the MCP client"""
        return self.mcp_client
    
    def ensure_initialized(self) -> bool:
        """Ensure agent is initialized, attempt initialization if not"""
        if self.is_initialized():
            return True
        
        self.logger.info("Agent not initialized, checking MCP server status...")
        if self.mcp_manager.is_server_running():
            self.logger.info("MCP server is running, attempting to initialize agent...")
            return self.initialize()
        else:
            self.logger.error("MCP server is not running")
            return False
