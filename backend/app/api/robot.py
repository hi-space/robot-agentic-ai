import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from app.models.schemas import RobotCommand, CommandResponse
from app.services.robot_control_service import RobotControlService, CommandPriority

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/robot", tags=["robot"])

# Dependency to get robot control service
def get_robot_control() -> RobotControlService:
    return RobotControlService()


@router.post("/execute", response_model=CommandResponse)
async def execute_robot_command(
    command: str,
    parameters: Optional[Dict[str, Any]] = None,
    priority: int = CommandPriority.NORMAL.value,
    timeout: Optional[int] = None,
    session_id: Optional[str] = None,
    robot_control: RobotControlService = Depends(get_robot_control)
):
    """
    Execute a robot command
    
    Args:
        command: Command to execute
        parameters: Command parameters
        priority: Command priority (1-4, lower is higher priority)
        timeout: Command timeout in seconds
        session_id: Session identifier
        robot_control: Robot control service instance
        
    Returns:
        Command execution result
    """
    try:
        logger.info(f"Executing robot command: {command}")
        
        result = await robot_control.execute_command(
            command=command,
            parameters=parameters,
            priority=priority,
            timeout=timeout,
            session_id=session_id
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error executing robot command: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"로봇 명령 실행 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/emergency-stop", response_model=CommandResponse)
async def emergency_stop(
    robot_control: RobotControlService = Depends(get_robot_control)
):
    """
    Execute emergency stop command
    
    Returns:
        Emergency stop result
    """
    try:
        logger.warning("Emergency stop command received")
        
        result = await robot_control.execute_command(
            command="emergency_stop",
            priority=CommandPriority.EMERGENCY.value
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in emergency stop: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"비상 정지 실행 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/resume", response_model=CommandResponse)
async def resume_operation(
    robot_control: RobotControlService = Depends(get_robot_control)
):
    """
    Resume robot operation after emergency stop
    
    Returns:
        Resume operation result
    """
    try:
        logger.info("Resume operation command received")
        
        result = await robot_control.resume_operation()
        
        return result
        
    except Exception as e:
        logger.error(f"Error resuming operation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"운영 재개 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/status")
async def get_robot_status(
    robot_control: RobotControlService = Depends(get_robot_control)
):
    """
    Get current robot status
    
    Returns:
        Robot status information
    """
    try:
        status = await robot_control.get_robot_status()
        return status
        
    except Exception as e:
        logger.error(f"Error getting robot status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"로봇 상태를 가져오는 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/queue")
async def get_command_queue(
    robot_control: RobotControlService = Depends(get_robot_control)
):
    """
    Get current command queue status
    
    Returns:
        Command queue information
    """
    try:
        queue_status = await robot_control.get_queue_status()
        return queue_status
        
    except Exception as e:
        logger.error(f"Error getting command queue: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"명령 큐를 가져오는 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/commands/{command_id}")
async def get_command_status(
    command_id: str,
    robot_control: RobotControlService = Depends(get_robot_control)
):
    """
    Get status of a specific command
    
    Args:
        command_id: Command identifier
        
    Returns:
        Command status information
    """
    try:
        status = await robot_control.get_command_status(command_id)
        if not status:
            raise HTTPException(
                status_code=404,
                detail=f"명령을 찾을 수 없습니다: {command_id}"
            )
        
        return {"command": status}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting command status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"명령 상태를 가져오는 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("/commands/{command_id}")
async def cancel_command(
    command_id: str,
    robot_control: RobotControlService = Depends(get_robot_control)
):
    """
    Cancel a specific command
    
    Args:
        command_id: Command identifier
        
    Returns:
        Cancellation result
    """
    try:
        success = await robot_control._cancel_command(command_id)
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"명령을 찾을 수 없습니다: {command_id}"
            )
        
        return {"message": f"명령이 취소되었습니다: {command_id}", "success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error canceling command: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"명령 취소 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/clear-history")
async def clear_command_history(
    older_than_hours: int = 24,
    robot_control: RobotControlService = Depends(get_robot_control)
):
    """
    Clear old command history
    
    Args:
        older_than_hours: Clear commands older than this many hours
        
    Returns:
        Number of commands cleared
    """
    try:
        cleared_count = await robot_control.clear_command_history(older_than_hours)
        
        return {
            "message": f"{cleared_count}개의 오래된 명령이 삭제되었습니다.",
            "cleared_count": cleared_count
        }
        
    except Exception as e:
        logger.error(f"Error clearing command history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"명령 기록 삭제 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/health")
async def robot_health_check(
    robot_control: RobotControlService = Depends(get_robot_control)
):
    """
    Check robot control service health
    
    Returns:
        Robot control service health status
    """
    try:
        health = await robot_control.health_check()
        return health
        
    except Exception as e:
        logger.error(f"Error checking robot control health: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"로봇 제어 서비스 상태 확인 중 오류가 발생했습니다: {str(e)}"
        )
