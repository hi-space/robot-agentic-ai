import logging
import asyncio
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
import json

from app.models.schemas import MessageRequest, MessageResponse
from app.services.agent_service import StrandsAgentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Dependency to get Strands Agent service
def get_strands_agent() -> StrandsAgentService:
    return StrandsAgentService()


@router.post("/", response_model=MessageResponse)
async def send_message(
    request: MessageRequest,
    strands_agent: StrandsAgentService = Depends(get_strands_agent)
):
    """
    Send a message to the AI agent and get a response
    
    Args:
        request: Message request containing user message
        strands_agent: Strands Agent service instance
        
    Returns:
        AI agent response
    """
    try:
        logger.info(f"Received message: {request.message[:100]}...")
        
        # Process message through Strands Agent
        response = await strands_agent.process_message(
            message=request.message,
            session_id=request.session_id,
            stream=False
        )
        
        return MessageResponse(
            content=response.get("content", ""),
            session_id=request.session_id,
            is_error=response.get("is_error", False)
        )
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"메시지 처리 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/stream")
async def send_message_stream(
    request: MessageRequest,
    strands_agent: StrandsAgentService = Depends(get_strands_agent)
):
    """
    Send a message to the AI agent and get a streaming response
    
    Args:
        request: Message request containing user message
        strands_agent: Strands Agent service instance
        
    Returns:
        Streaming response from AI agent
    """
    try:
        logger.info(f"Received streaming message: {request.message[:100]}...")
        
        async def generate_response():
            try:
                # Process message through Strands Agent
                response = await strands_agent.process_message(
                    message=request.message,
                    session_id=request.session_id,
                    stream=True
                )
                
                # Stream the response
                content = response.get("content", "")
                for chunk in content.split():
                    yield f"data: {json.dumps({'content': chunk + ' ', 'done': False})}\n\n"
                    await asyncio.sleep(0.1)  # Small delay for streaming effect
                
                # Send final chunk
                yield f"data: {json.dumps({'content': '', 'done': True, 'action_taken': response.get('action_taken')})}\n\n"
                
            except Exception as e:
                logger.error(f"Error in streaming response: {e}")
                yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"
        
        return StreamingResponse(
            generate_response(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing streaming message: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"스트리밍 메시지 처리 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/recommended-commands")
async def get_recommended_commands(
    strands_agent: StrandsAgentService = Depends(get_strands_agent)
):
    """
    Get recommended commands for the user
    
    Returns:
        List of recommended commands
    """
    try:
        commands = await strands_agent.get_recommended_commands()
        return {"commands": commands}
        
    except Exception as e:
        logger.error(f"Error getting recommended commands: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"추천 명령어를 가져오는 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/tasks")
async def get_active_tasks(
    strands_agent: StrandsAgentService = Depends(get_strands_agent)
):
    """
    Get all active tasks
    
    Returns:
        List of active tasks
    """
    try:
        tasks = await strands_agent.get_active_tasks()
        return {"tasks": tasks}
        
    except Exception as e:
        logger.error(f"Error getting active tasks: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"활성 작업을 가져오는 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/tasks/{task_id}")
async def get_task_status(
    task_id: str,
    strands_agent: StrandsAgentService = Depends(get_strands_agent)
):
    """
    Get status of a specific task
    
    Args:
        task_id: Task identifier
        
    Returns:
        Task status information
    """
    try:
        task = await strands_agent.get_task_status(task_id)
        if not task:
            raise HTTPException(
                status_code=404,
                detail=f"작업을 찾을 수 없습니다: {task_id}"
            )
        
        return {"task": task}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"작업 상태를 가져오는 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("/tasks/{task_id}")
async def cancel_task(
    task_id: str,
    strands_agent: StrandsAgentService = Depends(get_strands_agent)
):
    """
    Cancel a specific task
    
    Args:
        task_id: Task identifier
        
    Returns:
        Cancellation result
    """
    try:
        success = await strands_agent.cancel_task(task_id)
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"작업을 찾을 수 없습니다: {task_id}"
            )
        
        return {"message": f"작업이 취소되었습니다: {task_id}", "success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error canceling task: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"작업 취소 중 오류가 발생했습니다: {str(e)}"
        )
