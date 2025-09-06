import logging
from fastapi import APIRouter, HTTPException, Depends

from app.services.strands_agent_service import StrandsAgentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/commands", tags=["commands"])

# Dependency to get Strands Agent service
def get_strands_agent() -> StrandsAgentService:
    return StrandsAgentService()


@router.get("/recommended")
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
