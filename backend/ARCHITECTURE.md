# Robot Agentic AI Backend Architecture

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React)                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │ Chat UI     │ │ Voice UI    │ │ Robot UI    │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────▼───────────────────────────────────────────┐
│                FastAPI Backend                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    API Layer                                ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          ││
│  │  │ Chat    │ │ Voice   │ │ Robot   │ │ Health  │          ││
│  │  │ API     │ │ API     │ │ API     │ │ API     │          ││
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘          ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Service Layer                               ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          ││
│  │  │ Strands     │ │ Voice       │ │ Robot       │          ││
│  │  │ Agent       │ │ Service     │ │ Control     │          ││
│  │  │ Service     │ │             │ │ Service     │          ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘          ││
│  │  ┌─────────────┐ ┌─────────────┐                          ││
│  │  │ Bedrock     │ │ MCP         │                          ││
│  │  │ Service     │ │ Service     │                          ││
│  │  └─────────────┘ └─────────────┘                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                External Services                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │ Amazon      │ │ MCP Server  │ │ Audio       │              │
│  │ Bedrock     │ │ (Robot      │ │ Processing  │              │
│  │ Claude 3.7  │ │ Control)    │ │ Libraries   │              │
│  │ Sonnet      │ │             │ │             │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## 컴포넌트 상세

### 1. API Layer
- **Chat API**: 텍스트 기반 대화 처리
- **Voice API**: 음성 인식/합성 처리
- **Robot API**: 로봇 제어 명령 처리
- **Health API**: 시스템 상태 모니터링

### 2. Service Layer

#### Strands Agent Service
- Amazon Bedrock Strands Agent SDK 통합
- 자연어 처리 및 명령 해석
- 대화 컨텍스트 관리
- 로봇 명령 vs 일반 대화 구분

#### Bedrock Service
- Claude 3.7 Sonnet 모델 연동
- LangChain을 통한 LLM 추상화
- 스트리밍 응답 지원
- 로봇 명령 생성

#### Voice Service
- Speech-to-Text (STT): Google Speech Recognition
- Text-to-Speech (TTS): pyttsx3, Google TTS
- 오디오 파일 처리 (pydub)
- 다국어 지원

#### Robot Control Service
- 명령 큐 관리
- 우선순위 기반 실행
- 비상 정지 기능
- 명령 상태 추적

#### MCP Service
- Model Context Protocol 통신
- 로봇 하드웨어 제어
- 실시간 상태 모니터링
- 명령 실행 및 결과 반환

### 3. Data Models
- **Pydantic 스키마**: 타입 안전성 보장
- **메시지 모델**: 채팅 메시지 구조
- **작업 모델**: 로봇 작업 추적
- **명령 모델**: 로봇 제어 명령

## 데이터 플로우

### 1. 텍스트 메시지 처리
```
User Input → Chat API → Strands Agent Service → Bedrock Service → Claude 3.7
                                                      ↓
Response ← Chat API ← Strands Agent Service ← Bedrock Service ← Claude 3.7
```

### 2. 음성 메시지 처리
```
Audio Input → Voice API → Voice Service (STT) → Strands Agent Service
                                                      ↓
Audio Response ← Voice API ← Voice Service (TTS) ← Strands Agent Service
```

### 3. 로봇 명령 처리
```
User Command → Strands Agent Service → Robot Control Service → MCP Service
                                                                    ↓
Command Result ← Strands Agent Service ← Robot Control Service ← MCP Service
```

## 보안 및 인증

### 1. AWS 인증
- AWS Access Key/Secret Key
- Bedrock 서비스 권한
- 리전별 엔드포인트 설정

### 2. CORS 설정
- 프론트엔드 도메인 허용
- 개발/프로덕션 환경 분리
- 신뢰할 수 있는 호스트 설정

### 3. 입력 검증
- Pydantic 모델 검증
- 파일 타입 및 크기 제한
- SQL 인젝션 방지

## 성능 최적화

### 1. 비동기 처리
- FastAPI 비동기 지원
- asyncio 기반 서비스
- 동시 요청 처리

### 2. 캐싱
- 명령 결과 캐싱
- 음성 파일 임시 저장
- 세션 상태 관리

### 3. 리소스 관리
- 연결 풀 관리
- 메모리 사용량 모니터링
- 임시 파일 정리

## 모니터링 및 로깅

### 1. 헬스 체크
- 서비스별 상태 확인
- 의존성 서비스 모니터링
- 실시간 상태 API

### 2. 로깅
- 구조화된 로그 포맷
- 로그 레벨 설정
- 에러 추적 및 디버깅

### 3. 메트릭
- API 응답 시간
- 명령 실행 성공률
- 음성 처리 정확도

## 배포 및 확장성

### 1. Docker 컨테이너화
- 멀티스테이지 빌드
- 의존성 최적화
- 환경별 설정 분리

### 2. 수평적 확장
- 로드 밸런서 지원
- 상태 비저장 설계
- 세션 외부 저장

### 3. 환경 관리
- 개발/스테이징/프로덕션
- 환경 변수 기반 설정
- 시크릿 관리
