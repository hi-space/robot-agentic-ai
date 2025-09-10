# Robot Agentic API

이 프로젝트는 로봇 에이전트 AI 시스템을 위한 API Gateway와 Lambda 함수들로 구성된 백엔드 서비스입니다.

## 아키텍처

```
IoT Core -> Lambda (iot_to_sqs) -> SQS -> Lambda (robot_feedback) -> API Gateway
                                                                    -> DynamoDB
```

## 주요 기능

### 1. 채팅 내역 기반 다음 질문 목록 API
- **엔드포인트**: `POST /chat-suggestions`
- **기능**: 채팅 내역을 분석하여 다음에 올 수 있는 질문들을 제안
- **데이터 로드**: Bedrock AgentCore Memory

### 2. 로봇 작업 피드백 API
- **엔드포인트**: `POST /robot-feedback`
- **기능**: IoT Core에서 받은 로봇 작업 피드백을 SQS에서 조회
- **데이터 저장**: DynamoDB (RobotFeedback 테이블)

## 프로젝트 구조

```
be/
├── lambda_functions/
│   ├── chat_suggestions/          # 채팅 제안 Lambda
│   │   └── handler.py
│   ├── robot_feedback/            # 로봇 피드백 Lambda
│   │   └── handler.py
│   └── iot_to_sqs/                # IoT Core -> SQS Lambda
│       └── handler.py
├── deploy/
│   ├── cloudformation.yaml        # CloudFormation 템플릿
│   ├── deploy.sh                  # 배포 스크립트
│   └── package.sh                 # 패키징 스크립트
├── cdk/
│   ├── lib/
│   │   └── robot-agentic-api-stack.ts  # CDK 스택
│   ├── app.ts                     # CDK 앱
│   └── package.json               # CDK 의존성
├── scripts/
│   ├── setup.sh                   # 초기 설정 스크립트
│   ├── test_api.sh                # API 테스트 스크립트
│   ├── test_simple.sh             # 간단한 로컬 테스트
│   ├── test_local.sh              # 상세한 로컬 테스트
│   ├── deploy_lambda.sh           # Lambda 함수 배포
│   └── quick_deploy.sh            # 빠른 Lambda 배포
├── requirements.txt               # Python 의존성
└── README.md
```

## 배포 방법

### 방법 1: CloudFormation + 스크립트 사용

1. **초기 설정**
```bash
./scripts/setup.sh
```

2. **패키징**
```bash
./deploy/package.sh
```

3. **배포**
```bash
./deploy/deploy.sh
```

### 방법 2: CDK 사용

1. **CDK 설치 및 설정**
```bash
cd cdk
npm install
```

2. **배포**
```bash
cdk deploy
```

### 방법 3: Lambda 함수만 빠른 배포

1. **Lambda 함수만 배포 (CloudFormation 스택이 이미 있는 경우)**
```bash
./scripts/quick_deploy.sh
```

2. **개별 Lambda 함수 배포**
```bash
./scripts/deploy_lambda.sh
```

## 로컬 테스트

### 간단한 로컬 테스트
```bash
./scripts/test_simple.sh
```

### 상세한 로컬 테스트 (Mock 데이터 포함)
```bash
./scripts/test_local.sh
```

### API 테스트 (배포 후)
```bash
./scripts/test_api.sh
```

## API 사용법

### 1. 채팅 제안 API

**요청:**
```bash
curl -X POST "https://your-api-gateway-url/chat-suggestions" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "user-session-123",
    "limit": 5
  }'
```

**응답:**
```json
{
  "session_id": "user-session-123",
  "suggestions": [
    "로봇이 인사해줘",
    "로봇이 춤춰줘",
    "로봇이 앞으로 점프해줘",
    "로봇이 앉아줘",
    "로봇이 일어서줘"
  ],
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 2. 로봇 피드백 API

**요청:**
```bash
curl -X POST "https://your-api-gateway-url/robot-feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "user-session-123",
    "task_id": "task-456",
    "limit": 10
  }'
```

**응답:**
```json
{
  "session_id": "user-session-123",
  "task_id": "task-456",
  "feedback": [
    {
      "message_id": "msg-123",
      "status": "completed",
      "message": "로봇이 인사 제스처를 완료했습니다",
      "timestamp": "2024-01-01T10:00:00Z",
      "robot_data": {
        "position": "standing",
        "battery": 85
      },
      "progress": 100
    }
  ],
  "count": 1,
  "timestamp": "2024-01-01T10:00:00Z"
}
```

## 테스트

API 테스트를 실행하려면:

```bash
./scripts/test_api.sh
```

## 환경 변수

- `CHAT_HISTORY_TABLE`: DynamoDB 채팅 내역 테이블 이름
- `ROBOT_FEEDBACK_TABLE`: DynamoDB 로봇 피드백 테이블 이름
- `ROBOT_FEEDBACK_QUEUE`: SQS 큐 URL

## 의존성

- Python 3.9+
- AWS CLI
- Node.js (CDK 사용 시)
- AWS CDK (CDK 사용 시)

## 라이선스

MIT License
