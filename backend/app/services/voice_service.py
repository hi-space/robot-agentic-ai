import os
import io
import logging
import asyncio
from typing import Optional, Tuple
from datetime import datetime
import speech_recognition as sr
from gtts import gTTS
import pyttsx3
from pydub import AudioSegment
from pydub.playback import play
import tempfile

from app.core.config import settings

logger = logging.getLogger(__name__)


class VoiceService:
    """
    Service for speech-to-text and text-to-speech functionality
    Supports multiple TTS engines and STT recognition
    """
    
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        self.tts_engine = None
        self._initialize_tts()
    
    def _initialize_tts(self):
        """Initialize text-to-speech engine"""
        try:
            # Initialize pyttsx3 engine
            self.tts_engine = pyttsx3.init()
            
            # Configure voice settings
            voices = self.tts_engine.getProperty('voices')
            if voices:
                # Try to find Korean voice
                for voice in voices:
                    if 'korean' in voice.name.lower() or 'ko' in voice.id.lower():
                        self.tts_engine.setProperty('voice', voice.id)
                        break
            
            # Set speech rate and volume
            self.tts_engine.setProperty('rate', int(200 * settings.voice_speed))
            self.tts_engine.setProperty('volume', settings.voice_volume)
            
            logger.info("TTS engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize TTS engine: {e}")
            self.tts_engine = None
    
    async def speech_to_text(
        self,
        audio_data: bytes,
        language: str = None,
        format: str = "wav"
    ) -> str:
        """
        Convert speech audio to text
        
        Args:
            audio_data: Audio file data
            language: Language code (e.g., 'ko-KR', 'en-US')
            format: Audio format
            
        Returns:
            Transcribed text
        """
        try:
            # Use provided language or default
            lang = language or settings.voice_language
            
            # Create temporary file for audio processing
            with tempfile.NamedTemporaryFile(suffix=f".{format}", delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name
            
            try:
                # Load audio file
                audio = AudioSegment.from_file(temp_file_path)
                
                # Convert to WAV format if needed
                if format != "wav":
                    audio = audio.set_frame_rate(16000).set_channels(1)
                    wav_path = temp_file_path.replace(f".{format}", ".wav")
                    audio.export(wav_path, format="wav")
                    temp_file_path = wav_path
                
                # Use speech recognition
                with sr.AudioFile(temp_file_path) as source:
                    # Adjust for ambient noise
                    self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                    audio_data = self.recognizer.record(source)
                
                # Recognize speech
                text = self.recognizer.recognize_google(
                    audio_data,
                    language=lang
                )
                
                logger.info(f"Speech recognized: {text[:50]}...")
                return text
                
            finally:
                # Clean up temporary files
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                if os.path.exists(temp_file_path.replace(f".{format}", ".wav")):
                    os.unlink(temp_file_path.replace(f".{format}", ".wav"))
                    
        except sr.UnknownValueError:
            logger.warning("Could not understand audio")
            return "음성을 인식할 수 없습니다."
        except sr.RequestError as e:
            logger.error(f"Speech recognition service error: {e}")
            return "음성 인식 서비스에 오류가 발생했습니다."
        except Exception as e:
            logger.error(f"Error in speech_to_text: {e}")
            return f"음성 인식 중 오류가 발생했습니다: {str(e)}"
    
    async def text_to_speech(
        self,
        text: str,
        language: str = None,
        use_gtts: bool = False
    ) -> Optional[bytes]:
        """
        Convert text to speech audio
        
        Args:
            text: Text to convert to speech
            language: Language code
            use_gtts: Whether to use Google TTS instead of pyttsx3
            
        Returns:
            Audio data as bytes
        """
        try:
            lang = language or settings.voice_language
            
            if use_gtts:
                return await self._text_to_speech_gtts(text, lang)
            else:
                return await self._text_to_speech_pyttsx3(text)
                
        except Exception as e:
            logger.error(f"Error in text_to_speech: {e}")
            return None
    
    async def _text_to_speech_gtts(self, text: str, language: str) -> bytes:
        """Convert text to speech using Google TTS"""
        try:
            # Create gTTS object
            tts = gTTS(text=text, lang=language[:2])  # Use first 2 chars for language code
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                temp_file_path = temp_file.name
                tts.save(temp_file_path)
            
            try:
                # Read audio data
                with open(temp_file_path, 'rb') as f:
                    audio_data = f.read()
                
                return audio_data
                
            finally:
                # Clean up
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    
        except Exception as e:
            logger.error(f"Error in gTTS: {e}")
            return None
    
    async def _text_to_speech_pyttsx3(self, text: str) -> bytes:
        """Convert text to speech using pyttsx3"""
        try:
            if not self.tts_engine:
                logger.warning("TTS engine not available, falling back to gTTS")
                return await self._text_to_speech_gtts(text, settings.voice_language)
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file_path = temp_file.name
            
            try:
                # Configure engine to save to file
                self.tts_engine.save_to_file(text, temp_file_path)
                self.tts_engine.runAndWait()
                
                # Read audio data
                with open(temp_file_path, 'rb') as f:
                    audio_data = f.read()
                
                return audio_data
                
            finally:
                # Clean up
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    
        except Exception as e:
            logger.error(f"Error in pyttsx3: {e}")
            return None
    
    async def play_audio(self, audio_data: bytes) -> bool:
        """
        Play audio data
        
        Args:
            audio_data: Audio data to play
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name
            
            try:
                # Load and play audio
                audio = AudioSegment.from_file(temp_file_path)
                play(audio)
                return True
                
            finally:
                # Clean up
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    
        except Exception as e:
            logger.error(f"Error playing audio: {e}")
            return False
    
    async def get_available_voices(self) -> list:
        """Get list of available voices"""
        try:
            if not self.tts_engine:
                return []
            
            voices = self.tts_engine.getProperty('voices')
            return [
                {
                    "id": voice.id,
                    "name": voice.name,
                    "languages": voice.languages
                }
                for voice in voices
            ]
            
        except Exception as e:
            logger.error(f"Error getting voices: {e}")
            return []
    
    async def health_check(self) -> dict:
        """Check voice service health"""
        try:
            # Test TTS engine
            tts_available = self.tts_engine is not None
            
            # Test microphone
            mic_available = False
            try:
                with self.microphone as source:
                    self.recognizer.adjust_for_ambient_noise(source, duration=0.1)
                mic_available = True
            except:
                pass
            
            return {
                "status": "healthy" if tts_available else "degraded",
                "tts_available": tts_available,
                "microphone_available": mic_available,
                "language": settings.voice_language,
                "speed": settings.voice_speed,
                "volume": settings.voice_volume
            }
            
        except Exception as e:
            logger.error(f"Voice service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }
