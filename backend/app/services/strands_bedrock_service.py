import json
import logging
from typing import Dict, Any, Optional, List, AsyncGenerator
import asyncio
from datetime import datetime
import boto3
from botocore.exceptions import ClientError, BotoCoreError

from app.core.config import settings

logger = logging.getLogger(__name__)


class StrandsBedrockService:
    """
    Strands Agent SDK 스타일의 Bedrock 서비스
    boto3를 직접 사용하여 Bedrock Claude와 통신
    """
    
    def __init__(self):
        self.client = None
        self.model_id = settings.bedrock_model_id
        self._initialize_client()
    
    def _initialize_client(self):
        """Bedrock 클라이언트 초기화"""
        try:
            self.client = boto3.client(
                'bedrock-runtime',
                region_name=settings.aws_region,
            )
            logger.info(f"Bedrock client initialized with model: {self.model_id}")
        except Exception as e:
            logger.error(f"Failed to initialize Bedrock client: {e}")
            raise
    
    def _create_messages(self, user_message: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> List[Dict[str, str]]:
        """메시지 배열 생성"""
        messages = []
        
        # 시스템 프롬프트
        system_prompt = self._get_system_prompt()
        messages.append({
            "role": "user",
            "content": [{"text": system_prompt}]
        })
        
        # 대화 히스토리 추가
        if conversation_history:
            for msg in conversation_history[-10:]:  # 최근 10개만
                role = "user" if msg["role"] == "user" else "assistant"
                messages.append({
                    "role": role,
                    "content": [{"text": msg["content"]}]
                })
        
        # 현재 사용자 메시지
        messages.append({
            "role": "user",
            "content": [{"text": user_message}]
        })
        
        return messages
    
    def _get_system_prompt(self) -> str:
        """시스템 프롬프트 생성"""
        return """
        당신은 로봇 제어 AI 어시스턴트입니다. 
        
        주요 기능:
        1. 사용자의 자연어 명령을 로봇 제어 명령으로 해석
        2. MCP 도구를 사용하여 로봇 하드웨어 제어
        3. 친근하고 도움이 되는 대화 제공
        
        로봇 명령 키워드:
        - 이동: move_forward, move_backward, move_left, move_right
        - 회전: turn_left, turn_right
        - 정지: stop, emergency_stop
        - 그리퍼: pick_up, put_down, open_gripper, close_gripper
        - 상태: get_status, go_home
        
        명령이 명확하지 않으면 사용자에게 확인을 요청하세요.
        한국어로 응답하세요.
        """
    
    async def generate_response(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        stream: bool = False
    ) -> str:
        """
        Bedrock을 사용하여 응답 생성
        
        Args:
            message: 사용자 메시지
            conversation_history: 대화 히스토리
            stream: 스트리밍 여부
            
        Returns:
            생성된 응답
        """
        try:
            messages = self._create_messages(message, conversation_history)
            
            # Bedrock 요청 구성
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4000,
                "temperature": 0.7,
                "messages": messages
            }
            
            if stream:
                # 스트리밍 응답 - 별도 메서드로 처리
                response_text = ""
                async for chunk in self._generate_stream_response(request_body):
                    response_text += chunk
                return response_text
            else:
                # 일반 응답
                response = self.client.invoke_model(
                    modelId=self.model_id,
                    body=json.dumps(request_body),
                    contentType="application/json"
                )
                
                response_body = json.loads(response['body'].read())
                return response_body['content'][0]['text']
                
        except ClientError as e:
            logger.error(f"Bedrock client error: {e}")
            return f"죄송합니다. 응답 생성 중 오류가 발생했습니다: {str(e)}"
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"죄송합니다. 응답 생성 중 오류가 발생했습니다: {str(e)}"
    
    async def _generate_stream_response(self, request_body: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """스트리밍 응답 생성"""
        try:
            response = self.client.invoke_model_with_response_stream(
                modelId=self.model_id,
                body=json.dumps(request_body),
                contentType="application/json"
            )
            
            for event in response['body']:
                if 'chunk' in event:
                    chunk = json.loads(event['chunk']['bytes'].decode())
                    if chunk['type'] == 'content_block_delta':
                        delta = chunk['delta']
                        if 'text' in delta:
                            yield delta['text']
        except Exception as e:
            logger.error(f"Error in stream response: {e}")
            yield f"스트리밍 응답 중 오류가 발생했습니다: {str(e)}"
    
    async def generate_robot_command(
        self,
        user_input: str,
        available_commands: List[str],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        자연어 입력을 로봇 명령으로 변환
        
        Args:
            user_input: 자연어 명령
            available_commands: 사용 가능한 명령 목록
            context: 추가 컨텍스트
            
        Returns:
            명령 정보 딕셔너리
        """
        try:
            command_prompt = f"""
            사용자 입력: "{user_input}"
            사용 가능한 명령: {', '.join(available_commands)}
            컨텍스트: {context or '없음'}
            
            위 입력을 분석하여 적절한 로봇 명령을 선택하고 JSON 형태로 응답하세요:
            {{
                "command": "선택된_명령",
                "parameters": {{"param1": "value1"}},
                "confidence": 0.95,
                "explanation": "명령 설명"
            }}
            
            명령을 이해할 수 없으면 command를 "error"로 설정하세요.
            """
            
            response = await self.generate_response(command_prompt)
            
            # JSON 응답 파싱
            try:
                command_data = json.loads(response)
                return command_data
            except json.JSONDecodeError:
                # JSON이 아닌 경우 텍스트에서 명령 추출 시도
                return self._extract_command_from_text(response, available_commands)
                
        except Exception as e:
            logger.error(f"Error generating robot command: {e}")
            return {
                "command": "error",
                "parameters": {},
                "confidence": 0.0,
                "explanation": f"명령 생성 중 오류: {str(e)}"
            }
    
    def _extract_command_from_text(self, text: str, available_commands: List[str]) -> Dict[str, Any]:
        """텍스트에서 명령 추출"""
        text_lower = text.lower()
        
        # 키워드 매칭
        command_keywords = {
            "move_forward": ["앞으로", "앞", "전진", "가"],
            "move_backward": ["뒤로", "뒤", "후진"],
            "move_left": ["왼쪽", "좌"],
            "move_right": ["오른쪽", "우"],
            "turn_left": ["왼쪽으로 회전", "왼쪽 돌아"],
            "turn_right": ["오른쪽으로 회전", "오른쪽 돌아"],
            "stop": ["정지", "멈춰", "정지해"],
            "pick_up": ["들어", "잡아", "집어"],
            "put_down": ["놓아", "내려"],
            "open_gripper": ["그리퍼 열어", "손 열어"],
            "close_gripper": ["그리퍼 닫아", "손 닫아"]
        }
        
        for command, keywords in command_keywords.items():
            if command in available_commands:
                for keyword in keywords:
                    if keyword in text_lower:
                        return {
                            "command": command,
                            "parameters": {},
                            "confidence": 0.8,
                            "explanation": f"키워드 '{keyword}'로 명령 인식"
                        }
        
        return {
            "command": "error",
            "parameters": {},
            "confidence": 0.0,
            "explanation": "명령을 인식할 수 없습니다"
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """서비스 상태 확인"""
        try:
            # 간단한 테스트 요청
            test_response = await self.generate_response("안녕하세요")
            
            return {
                "status": "healthy",
                "model": self.model_id,
                "region": settings.aws_region,
                "test_response": test_response[:100] if test_response else "No response"
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }