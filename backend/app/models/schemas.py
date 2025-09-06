from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from enum import Enum


class MessageSender(str, Enum):
    USER = "user"
    AI = "ai"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskType(str, Enum):
    COMMAND = "command"
    ACTION = "action"
    RESPONSE = "response"


class MessageRequest(BaseModel):
    message: str = Field(..., description="User message content")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)
    session_id: Optional[str] = Field(None, description="Session identifier")


class MessageResponse(BaseModel):
    content: str = Field(..., description="AI response content")
    timestamp: datetime = Field(default_factory=datetime.now)
    session_id: Optional[str] = Field(None, description="Session identifier")
    is_error: bool = Field(default=False, description="Whether this is an error response")


class VoiceRequest(BaseModel):
    audio_data: bytes = Field(..., description="Audio file data")
    format: str = Field(default="wav", description="Audio format")
    language: Optional[str] = Field(None, description="Audio language")


class VoiceResponse(BaseModel):
    text: str = Field(..., description="Transcribed text")
    audio_url: Optional[str] = Field(None, description="Generated audio URL")
    timestamp: datetime = Field(default_factory=datetime.now)


class Task(BaseModel):
    id: str = Field(..., description="Unique task identifier")
    title: str = Field(..., description="Task title")
    description: Optional[str] = Field(None, description="Task description")
    status: TaskStatus = Field(default=TaskStatus.PENDING, description="Task status")
    type: TaskType = Field(..., description="Task type")
    timestamp: datetime = Field(default_factory=datetime.now)
    progress: Optional[int] = Field(None, ge=0, le=100, description="Task progress percentage")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional task metadata")


class RobotCommand(BaseModel):
    command: str = Field(..., description="Robot command")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Command parameters")
    priority: int = Field(default=1, ge=1, le=10, description="Command priority")
    timeout: Optional[int] = Field(None, description="Command timeout in seconds")


class CommandResponse(BaseModel):
    success: bool = Field(..., description="Whether command was successful")
    message: str = Field(..., description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.now)


class RecommendedCommandsResponse(BaseModel):
    commands: List[str] = Field(..., description="List of recommended commands")


class HealthResponse(BaseModel):
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = Field(default="1.0.0", description="API version")
    services: Dict[str, str] = Field(..., description="Dependent services status")
