import logging
import asyncio
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
import json

from app.models.schemas import MessageRequest
from app.services.agent_service import StrandsAgentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stream", tags=["stream"])

# Dependency to get Strands Agent service
def get_strands_agent() -> StrandsAgentService:
    return StrandsAgentService()


@router.post("/")
async def stream_message(
    request: MessageRequest,
    strands_agent: StrandsAgentService = Depends(get_strands_agent)
):
    """
    Stream a message to the AI agent and get a streaming response
    
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
