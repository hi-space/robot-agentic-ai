# 환경 설정 가이드

이 문서는 Robot Agentic AI 프로젝트의 환경 설정 관리에 대해 설명합니다.

## 현재 환경 설정 구조

### 1. `amplify_outputs.json` 파일
- **위치**: `src/amplify_outputs.json`
- **용도**: AWS Amplify에서 자동 생성되는 인증 및 API 설정
- **내용**: Cognito User Pool, Identity Pool, API 엔드포인트 등 Amplify 관련 설정
- **특징**: Amplify CLI에 의해 자동 관리되며, 수동으로 편집하지 않음

### 2. `env.json` 파일
- **위치**: `src/env.json`
- **용도**: Bedrock Agent Core 관련 커스텀 환경 변수
- **내용**: AWS Bedrock Agent Runtime ARN, 리전, Qualifier 등
- **특징**: 수동으로 관리하며, 빌드 시 번들에 포함됨

## 환경 변수 구성

### `env.json` 파일 내용
```json
{
  "REACT_APP_AWS_REGION": "us-west-2",
  "REACT_APP_AGENT_RUNTIME_ARN": "arn:aws:bedrock-agentcore:us-west-2:YOUR_ACCOUNT_ID:runtime/YOUR_AGENT_NAME",
  "REACT_APP_QUALIFIER": "DEFAULT"
}
```

### `amplify_outputs.json` 파일 내용 (주요 부분)
```json
{
  "auth": {
    "user_pool_id": "us-west-2_XXXXXXXXX",
    "aws_region": "us-west-2",
    "user_pool_client_id": "xxxxxxxxxxxxxxxxxxxxxxxxxx",
    "identity_pool_id": "us-west-2:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  },
  "data": {
    "url": "https://api.graphql.us-west-2.amazonaws.com/graphql",
    "aws_region": "us-west-2"
  }
}
```

## 환경 설정 유틸리티

### `env-config.ts` 파일
- **위치**: `src/lib/env-config.ts`
- **기능**: `env.json` 파일에서 환경 변수를 안전하게 로드
- **특징**: 
  - 빌드 시 번들에 포함되어 외부 노출 방지
  - `process.env` 폴백 지원
  - TypeScript 타입 지원

### 주요 함수들
```typescript
// 환경 설정 로드
await loadEnvConfig()

// 환경 변수 비동기 접근
const region = await getEnvVar('REACT_APP_AWS_REGION', 'us-west-2')

// 환경 변수 동기 접근 (사전 로드 필요)
const region = getEnvVarSync('REACT_APP_AWS_REGION', 'us-west-2')

// 필수 환경 변수 검증
await validateRequiredEnvVars(['REACT_APP_AWS_REGION', 'REACT_APP_AGENT_RUNTIME_ARN'])
```

## 사용 방법

### 1. 환경 변수 설정
`env.json` 파일을 편집하여 Bedrock Agent 관련 설정을 관리합니다:

```json
{
  "REACT_APP_AWS_REGION": "us-west-2",
  "REACT_APP_AGENT_RUNTIME_ARN": "arn:aws:bedrock-agentcore:us-west-2:YOUR_ACCOUNT_ID:runtime/YOUR_AGENT_NAME",
  "REACT_APP_QUALIFIER": "DEFAULT"
}
```

### 2. 코드에서 환경 변수 사용
```typescript
import { getEnvVar, getEnvVarSync } from './lib/env-config'

// 비동기 방식 (권장)
const region = await getEnvVar('REACT_APP_AWS_REGION', 'us-west-2')
const agentArn = await getEnvVar('REACT_APP_AGENT_RUNTIME_ARN')

// 동기 방식 (사전 로드 필요)
const region = getEnvVarSync('REACT_APP_AWS_REGION', 'us-west-2')
```

### 3. 앱 초기화
`App.tsx`에서 환경 설정이 자동으로 초기화됩니다:

```typescript
useEffect(() => {
  const initializeApp = async () => {
    await initializeEnvConfig()
    // ... 기타 초기화 로직
  }
  initializeApp()
}, [])
```
