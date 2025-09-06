import logging
import os
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, BackgroundTasks
from fastapi.responses import FileResponse
import tempfile

from app.models.schemas import VoiceRequest, VoiceResponse
from app.services.voice_service import VoiceService
from app.services.agent_service import StrandsAgentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice", tags=["voice"])

# Dependency to get services
def get_voice_service() -> VoiceService:
    return VoiceService()

def get_strands_agent() -> StrandsAgentService:
    return StrandsAgentService()


@router.post("/transcribe", response_model=VoiceResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
    voice_service: VoiceService = Depends(get_voice_service)
):
    """
    Transcribe audio to text
    
    Args:
        audio: Audio file to transcribe
        language: Language code (optional)
        voice_service: Voice service instance
        
    Returns:
        Transcribed text
    """
    try:
        # Validate file type
        if not audio.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400,
                detail="오디오 파일만 업로드할 수 있습니다."
            )
        
        # Read audio data
        audio_data = await audio.read()
        
        # Get file extension
        file_extension = audio.filename.split('.')[-1] if '.' in audio.filename else 'wav'
        
        logger.info(f"Transcribing audio file: {audio.filename}, size: {len(audio_data)} bytes")
        
        # Transcribe audio
        text = await voice_service.speech_to_text(
            audio_data=audio_data,
            language=language,
            format=file_extension
        )
        
        return VoiceResponse(
            text=text,
            timestamp=datetime.now()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"음성 인식 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/synthesize")
async def synthesize_speech(
    text: str = Form(...),
    language: Optional[str] = Form(None),
    use_gtts: bool = Form(False),
    voice_service: VoiceService = Depends(get_voice_service)
):
    """
    Synthesize text to speech
    
    Args:
        text: Text to synthesize
        language: Language code (optional)
        use_gtts: Whether to use Google TTS
        voice_service: Voice service instance
        
    Returns:
        Audio file response
    """
    try:
        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="텍스트를 입력해주세요."
            )
        
        logger.info(f"Synthesizing text: {text[:100]}...")
        
        # Synthesize speech
        audio_data = await voice_service.text_to_speech(
            text=text,
            language=language,
            use_gtts=use_gtts
        )
        
        if not audio_data:
            raise HTTPException(
                status_code=500,
                detail="음성 합성에 실패했습니다."
            )
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
        
        background_tasks = BackgroundTasks()
        background_tasks.add_task(os.unlink, temp_file_path)
        
        return FileResponse(
            path=temp_file_path,
            media_type="audio/wav",
            filename="synthesized_speech.wav",
            background=background_tasks
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error synthesizing speech: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"음성 합성 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/process-voice-message")
async def process_voice_message(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
    voice_service: VoiceService = Depends(get_voice_service),
    strands_agent: StrandsAgentService = Depends(get_strands_agent)
):
    """
    Process voice message: transcribe and get AI response
    
    Args:
        audio: Audio file to process
        language: Language code (optional)
        voice_service: Voice service instance
        strands_agent: Strands Agent service instance
        
    Returns:
        AI response to the transcribed message
    """
    try:
        # Validate file type
        if not audio.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400,
                detail="오디오 파일만 업로드할 수 있습니다."
            )
        
        # Read audio data
        audio_data = await audio.read()
        
        # Get file extension
        file_extension = audio.filename.split('.')[-1] if '.' in audio.filename else 'wav'
        
        logger.info(f"Processing voice message: {audio.filename}")
        
        # Transcribe audio
        text = await voice_service.speech_to_text(
            audio_data=audio_data,
            language=language,
            format=file_extension
        )
        
        if not text.strip():
            return {
                "text": "음성을 인식할 수 없습니다.",
                "response": "죄송합니다. 음성을 명확하게 인식하지 못했습니다. 다시 말씀해 주세요.",
                "is_error": True
            }
        
        # Process message through Strands Agent
        response = await strands_agent.process_message(
            message=text,
            stream=False
        )
        
        return {
            "text": text,
            "response": response.get("content", ""),
            "is_error": response.get("is_error", False),
            "action_taken": response.get("action_taken")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing voice message: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"음성 메시지 처리 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/voices")
async def get_available_voices(
    voice_service: VoiceService = Depends(get_voice_service)
):
    """
    Get available voices for TTS
    
    Returns:
        List of available voices
    """
    try:
        voices = await voice_service.get_available_voices()
        return {"voices": voices}
        
    except Exception as e:
        logger.error(f"Error getting available voices: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"사용 가능한 음성을 가져오는 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/health")
async def voice_health_check(
    voice_service: VoiceService = Depends(get_voice_service)
):
    """
    Check voice service health
    
    Returns:
        Voice service health status
    """
    try:
        health = await voice_service.health_check()
        return health
        
    except Exception as e:
        logger.error(f"Error checking voice service health: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"음성 서비스 상태 확인 중 오류가 발생했습니다: {str(e)}"
        )
