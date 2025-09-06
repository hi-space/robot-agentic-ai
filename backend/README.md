# Robot Agentic AI Backend

FastAPI 기반의 로봇 제어 AI 백엔드 서비스입니다. Amazon Bedrock Claude 3.7 Sonnet 모델을 활용하여 자연어 처리와 로봇 제어 기능을 제공합니다.

## 주요 기능

### 🤖 로봇 제어
- 자연어 명령을 로봇 제어 명령으로 변환
- MCP (Model Context Protocol)를 통한 로봇 제어
- 명령 우선순위 관리 및 큐잉
- 비상 정지 및 운영 재개 기능

### 🧠 AI 에이전트
- Amazon Bedrock Claude 3.7 Sonnet 모델 사용
- boto3를 통한 직접 Bedrock 통신
- 대화 컨텍스트 관리
- 로봇 명령 인식 및 처리

### 🎤 음성 처리
- 음성-텍스트 변환 (STT)
- 텍스트-음성 변환 (TTS)
- 다중 TTS 엔진 지원 (pyttsx3, Google TTS)
- 실시간 음성 메시지 처리

### 🔧 API 엔드포인트
- RESTful API 설계
- 실시간 스트리밍 지원
- 포괄적인 에러 처리
- 상세한 헬스 체크

## 기술 스택

- **Framework**: FastAPI 0.104.1
- **AI/ML**: Amazon Bedrock, Claude 3.7 Sonnet, boto3
- **Voice**: pyttsx3, Google TTS, SpeechRecognition
- **Audio**: pydub, pyaudio
- **HTTP Client**: httpx
- **Container**: Docker

## 프로젝트 구조

```
backend/
├── app/
│   ├── api/                    # API 엔드포인트
│   │   ├── chat.py            # 채팅 API
│   │   ├── voice.py           # 음성 처리 API
│   │   ├── robot.py           # 로봇 제어 API
│   │   └── health.py          # 헬스 체크 API
│   ├── core/                   # 핵심 설정
│   │   └── config.py          # 환경 설정
│   ├── models/                 # 데이터 모델
│   │   └── schemas.py         # Pydantic 스키마
│   ├── services/               # 비즈니스 로직
│   │   ├── bedrock_service.py      # Bedrock 서비스
│   │   ├── strands_agent_service.py # Strands Agent 서비스
│   │   ├── mcp_service.py          # MCP 서비스
│   │   ├── voice_service.py        # 음성 서비스
│   │   └── robot_control_service.py # 로봇 제어 서비스
│   └── utils/                  # 유틸리티
│       └── helpers.py         # 헬퍼 함수
├── audio/                      # 오디오 파일 저장소
│   ├── temp/                  # 임시 파일
│   └── output/                # 출력 파일
├── main.py                    # FastAPI 애플리케이션
├── requirements.txt           # Python 의존성
├── Dockerfile                # Docker 설정
├── docker-compose.yml        # Docker Compose 설정
└── env.example              # 환경 변수 예시
```

## 설치 및 실행

### 1. 환경 설정

```bash
# 저장소 클론
git clone <repository-url>
cd robot-agentic-ai/backend

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 또는
venv\Scripts\activate     # Windows

# 의존성 설치
pip install -r requirements.txt
```

### 2. 환경 변수 설정

```bash
# 환경 변수 파일 복사
cp env.example .env

# .env 파일 편집
nano .env
```

필수 환경 변수:
```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

### 3. 실행

#### 개발 모드
```bash
python main.py
```

#### 프로덕션 모드
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Docker 실행
```bash
# Docker 이미지 빌드
docker build -t robot-agentic-ai-backend .

# Docker 컨테이너 실행
docker run -p 8000:8000 --env-file .env robot-agentic-ai-backend
```

#### Docker Compose 실행
```bash
docker-compose up -d
```

## API 문서

서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 주요 API 엔드포인트

### 채팅 API
- `POST /api/chat/` - 메시지 전송
- `POST /api/chat/stream` - 스트리밍 메시지
- `GET /api/chat/recommended-commands` - 추천 명령어
- `GET /api/chat/tasks` - 활성 작업 목록

### 음성 API
- `POST /api/voice/transcribe` - 음성 인식
- `POST /api/voice/synthesize` - 음성 합성
- `POST /api/voice/process-voice-message` - 음성 메시지 처리
- `GET /api/voice/voices` - 사용 가능한 음성 목록

### 로봇 제어 API
- `POST /api/robot/execute` - 로봇 명령 실행
- `POST /api/robot/emergency-stop` - 비상 정지
- `POST /api/robot/resume` - 운영 재개
- `GET /api/robot/status` - 로봇 상태
- `GET /api/robot/queue` - 명령 큐 상태

### 헬스 체크 API
- `GET /api/health/` - 전체 시스템 상태
- `GET /api/health/detailed` - 상세 상태 정보
- `GET /api/health/strands-agent` - Strands Agent 상태
- `GET /api/health/voice` - 음성 서비스 상태
- `GET /api/health/robot` - 로봇 제어 상태

## 사용 예시

### 1. 텍스트 메시지 전송
```bash
curl -X POST "http://localhost:8000/api/chat/" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "로봇을 앞으로 이동시켜줘",
    "session_id": "session_123"
  }'
```

### 2. 음성 메시지 처리
```bash
curl -X POST "http://localhost:8000/api/voice/process-voice-message" \
  -F "audio=@voice_message.wav" \
  -F "language=ko-KR"
```

### 3. 로봇 명령 실행
```bash
curl -X POST "http://localhost:8000/api/robot/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "move_forward",
    "parameters": {"distance": 1.0},
    "priority": 2
  }'
```

## 개발 가이드

### 새로운 서비스 추가
1. `app/services/` 디렉토리에 서비스 클래스 생성
2. `app/api/` 디렉토리에 API 라우터 추가
3. `main.py`에서 라우터 등록

### 환경 변수 추가
1. `app/core/config.py`에 새로운 설정 추가
2. `env.example`에 예시 값 추가
3. 서비스에서 설정 사용

### 테스트
```bash
# 단위 테스트 실행
pytest tests/

# API 테스트 실행
pytest tests/api/

# 전체 테스트 실행
pytest
```

## 문제 해결

### 일반적인 문제

1. **AWS 인증 오류**
   - AWS 자격 증명이 올바른지 확인
   - Bedrock 서비스에 대한 권한 확인

2. **음성 처리 오류**
   - 오디오 시스템 라이브러리 설치 확인
   - 마이크 권한 확인

3. **MCP 서버 연결 오류**
   - MCP 서버가 실행 중인지 확인
   - 네트워크 연결 상태 확인

### 로그 확인
```bash
# 애플리케이션 로그
tail -f logs/app.log

# Docker 로그
docker logs robot-agentic-ai-backend
```

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
