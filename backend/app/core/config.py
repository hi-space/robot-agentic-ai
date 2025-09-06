import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # AWS Configuration
    aws_access_key_id: str = Field(..., env="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: str = Field(..., env="AWS_SECRET_ACCESS_KEY")
    aws_region: str = Field(default="us-east-1", env="AWS_REGION")
    
    # Bedrock Configuration
    bedrock_model_id: str = Field(
        default="anthropic.claude-3-5-sonnet-20241022-v2:0",
        env="BEDROCK_MODEL_ID"
    )
    bedrock_endpoint_url: Optional[str] = Field(
        default=None,
        env="BEDROCK_ENDPOINT_URL"
    )
    
    # Application Configuration
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8000, env="API_PORT")
    debug: bool = Field(default=False, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # CORS Configuration
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        env="CORS_ORIGINS"
    )
    
    # MCP Configuration
    mcp_server_url: str = Field(default="http://localhost:3001", env="MCP_SERVER_URL")
    mcp_timeout: int = Field(default=30, env="MCP_TIMEOUT")
    
    # Voice Configuration
    voice_language: str = Field(default="ko-KR", env="VOICE_LANGUAGE")
    voice_speed: float = Field(default=1.0, env="VOICE_SPEED")
    voice_volume: float = Field(default=0.8, env="VOICE_VOLUME")
    
    # Audio Configuration
    audio_temp_dir: str = "./audio/temp"
    audio_output_dir: str = "./audio/output"
    max_audio_file_size: int = 10 * 1024 * 1024  # 10MB
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
