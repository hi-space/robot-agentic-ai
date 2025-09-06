import logging
from fastapi import APIRouter, HTTPException
from datetime import datetime

from app.models.schemas import HealthResponse
from app.services.strands_agent_service import StrandsAgentService
from app.services.voice_service import VoiceService
from app.services.robot_control_service import RobotControlService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/", response_model=HealthResponse)
async def health_check():
    """
    Check overall system health
    
    Returns:
        System health status
    """
    try:
        # Initialize services
        strands_agent = StrandsAgentService()
        voice_service = VoiceService()
        robot_control = RobotControlService()
        
        # Check individual service health
        strands_health = await strands_agent.health_check()
        voice_health = await voice_service.health_check()
        robot_health = await robot_control.health_check()
        
        # Determine overall status
        overall_status = "healthy"
        if (strands_health.get("status") != "healthy" or 
            voice_health.get("status") != "healthy" or 
            robot_health.get("status") != "healthy"):
            overall_status = "degraded"
        
        if (strands_health.get("status") == "unhealthy" or 
            voice_health.get("status") == "unhealthy" or 
            robot_health.get("status") == "unhealthy"):
            overall_status = "unhealthy"
        
        return HealthResponse(
            status=overall_status,
            services={
                "strands_agent": strands_health.get("status", "unknown"),
                "voice_service": voice_health.get("status", "unknown"),
                "robot_control": robot_health.get("status", "unknown"),
                "bedrock": strands_health.get("bedrock", {}).get("status", "unknown"),
                "mcp": strands_health.get("mcp", {}).get("status", "unknown")
            }
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            services={
                "strands_agent": "unknown",
                "voice_service": "unknown", 
                "robot_control": "unknown",
                "bedrock": "unknown",
                "mcp": "unknown",
                "error": str(e)
            }
        )


@router.get("/detailed")
async def detailed_health_check():
    """
    Get detailed health information for all services
    
    Returns:
        Detailed health status for all services
    """
    try:
        # Initialize services
        strands_agent = StrandsAgentService()
        voice_service = VoiceService()
        robot_control = RobotControlService()
        
        # Get detailed health information
        strands_health = await strands_agent.health_check()
        voice_health = await voice_service.health_check()
        robot_health = await robot_control.health_check()
        
        return {
            "overall_status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "strands_agent": strands_health,
                "voice_service": voice_health,
                "robot_control": robot_health
            },
            "system_info": {
                "version": "1.0.0",
                "environment": "production"
            }
        }
        
    except Exception as e:
        logger.error(f"Detailed health check failed: {e}")
        return {
            "overall_status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "services": {
                "strands_agent": {"status": "unknown", "error": str(e)},
                "voice_service": {"status": "unknown", "error": str(e)},
                "robot_control": {"status": "unknown", "error": str(e)}
            }
        }


@router.get("/strands-agent")
async def strands_agent_health():
    """
    Check Strands Agent service health specifically
    
    Returns:
        Strands Agent health status
    """
    try:
        strands_agent = StrandsAgentService()
        health = await strands_agent.health_check()
        return health
        
    except Exception as e:
        logger.error(f"Strands Agent health check failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Strands Agent 상태 확인 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/voice")
async def voice_service_health():
    """
    Check voice service health specifically
    
    Returns:
        Voice service health status
    """
    try:
        voice_service = VoiceService()
        health = await voice_service.health_check()
        return health
        
    except Exception as e:
        logger.error(f"Voice service health check failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"음성 서비스 상태 확인 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/robot")
async def robot_control_health():
    """
    Check robot control service health specifically
    
    Returns:
        Robot control service health status
    """
    try:
        robot_control = RobotControlService()
        health = await robot_control.health_check()
        return health
        
    except Exception as e:
        logger.error(f"Robot control health check failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"로봇 제어 서비스 상태 확인 중 오류가 발생했습니다: {str(e)}"
        )
