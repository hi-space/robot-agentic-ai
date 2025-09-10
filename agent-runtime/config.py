import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class Config:
    """Configuration management for the agent runtime"""
    mcp_server_url: str
    bearer_token: Optional[str] = None
    model_id: str = "us.anthropic.claude-3-5-sonnet-20241022-v2:0" # us.anthropic.claude-3-7-sonnet-20250219-v1:0
    max_retries: int = 2
    request_timeout: int = 10
    
    @classmethod
    def from_env(cls) -> 'Config':
        """Create config from environment variables"""
        mcp_server_url = os.getenv("GATEWAY_URL")
        if mcp_server_url and not os.getenv("GATEWAY_URL"):
            os.environ["GATEWAY_URL"] = mcp_server_url
            
        return cls(
            mcp_server_url=mcp_server_url or "",
            bearer_token=os.getenv("BEARER_TOKEN")
        )
