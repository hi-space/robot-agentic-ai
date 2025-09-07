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
                # Process message through Strands Agent with streaming
                async for chunk in strands_agent.process_message_stream(
                    message=request.message,
                    session_id=request.session_id
                ):
                    # Format the chunk as Server-Sent Events
                    chunk_data = {
                        "content": chunk.get("content", ""),
                        "done": chunk.get("done", False),
                        "is_error": chunk.get("is_error", False),
                        "action_taken": chunk.get("action_taken")
                    }
                    
                    # Send the chunk
                    yield f"data: {json.dumps(chunk_data, ensure_ascii=False)}\n\n"
                    
                    # Small delay to prevent overwhelming the client
                    await asyncio.sleep(0.01)
                
            except Exception as e:
                logger.error(f"Error in streaming response: {e}")
                error_data = {
                    "content": f"스트리밍 처리 중 오류가 발생했습니다: {str(e)}",
                    "done": True,
                    "is_error": True,
                    "action_taken": None
                }
                yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
        
        return StreamingResponse(
            generate_response(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control"
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


@router.get("/stream")
async def stream_events():
    """
    Server-Sent Events endpoint for real-time communication
    
    Returns:
        Streaming response with SSE events
    """
    async def event_generator():
        try:
            # Send initial connection event
            yield f"data: {json.dumps({'type': 'connected', 'message': 'SSE connection established'}, ensure_ascii=False)}\n\n"
            
            # Keep connection alive
            while True:
                await asyncio.sleep(30)  # Send heartbeat every 30 seconds
                yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': asyncio.get_event_loop().time()}, ensure_ascii=False)}\n\n"
                
        except Exception as e:
            logger.error(f"Error in SSE stream: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )
