import json
from dataclasses import dataclass
from typing import Optional
from pathlib import Path


@dataclass
class Config:
    """Configuration management for the agent runtime"""
    mcp_server_url: str
    bearer_token: Optional[str] = None
    model_id: str = "us.anthropic.claude-3-5-sonnet-20241022-v2:0" # us.anthropic.claude-3-7-sonnet-20250219-v1:0
    max_retries: int = 2
    request_timeout: int = 10
    
    @classmethod
    def from_config_file(cls) -> 'Config':
        """Create config from config.json file"""
        config_path = Path(__file__).parent / "config.json"
        
        try:
            with open(config_path, 'r') as f:
                config_data = json.load(f)
            
            print(f"DEBUG: Loaded config from {config_path}")
            print(f"DEBUG: Gateway URL from config: {config_data.get('gateway_url', 'NOT_FOUND')}")
            
            return cls(
                mcp_server_url=config_data.get("gateway_url", ""),
                bearer_token=None  # Will be obtained from SSM at runtime
            )
            
        except FileNotFoundError:
            print(f"ERROR: config.json not found at {config_path}")
            return cls(mcp_server_url="")
        except json.JSONDecodeError as e:
            print(f"ERROR: Invalid JSON in config.json: {e}")
            return cls(mcp_server_url="")
