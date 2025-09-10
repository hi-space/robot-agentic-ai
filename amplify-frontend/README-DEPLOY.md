# 🚀 AWS Amplify 배포 가이드

## 배포 스크립트 사용법

### 1. Sandbox 배포 (개발/테스트용)
```bash
# Sandbox 환경 배포
./deploy.sh sandbox
# 또는
./quick-deploy.sh
```

### 2. Production 배포 (실제 서비스용)
```bash
# Production 배포 (App ID 자동 감지)
./deploy.sh production

# Production 배포 (App ID 직접 지정)
./deploy-production.sh <app-id> [branch]

# Pipeline 배포 (CI/CD용)
./deploy-pipeline.sh <app-id> [branch]
```

### 3. App ID 확인 방법
```bash
# Amplify 앱 목록 확인
npx ampx list

# 현재 앱 상태 확인
npx ampx status
```

## 수동 배포 명령어

### Amplify Gen 2 명령어들
```bash
cd amplify-frontend

# Sandbox 환경 (개발용)
npx ampx sandbox

# Sandbox 배포 (Amplify Gen 2 권장)
npx ampx sandbox

# CI/CD 파이프라인 배포 (GitHub Actions 등)
npx ampx pipeline-deploy --app-id YOUR_APP_ID --branch production

# 배포 상태 확인
npx ampx status

# 로그 확인
npx ampx logs

# Sandbox 삭제
npx ampx sandbox delete
```

### 프론트엔드 개발 명령어들
```bash
cd amplify-frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 프로덕션 빌드
npm run build

# 테스트 실행
npm test
```

## 배포 환경별 설명

### 1. Sandbox 환경 (Amplify Gen 2 권장)
- **용도**: 개발, 테스트, 프로덕션 테스트
- **특징**: 빠른 배포, 자동 삭제 가능, 실제 AWS 리소스 사용
- **명령어**: `npx ampx sandbox`
- **장점**: 로컬에서 실제 프로덕션과 동일한 환경 테스트 가능

### 2. CI/CD 파이프라인 배포
- **용도**: 실제 프로덕션 서비스
- **특징**: GitHub Actions, AWS CodePipeline 등과 연동
- **명령어**: `npx ampx pipeline-deploy --app-id YOUR_APP_ID --branch production`
- **요구사항**: AWS Amplify 앱 ID 필요, Git 리포지토리 연결 필요

### 3. Production 배포 방법
- **로컬 배포**: `./deploy-production.sh <app-id> [branch]`
- **Pipeline 배포**: `./deploy-pipeline.sh <app-id> [branch]`
- **자동 감지**: `./deploy.sh production` (amplify_outputs.json에서 App ID 자동 감지)

## 배포 후 확인사항

### 1. 배포 상태 확인
```bash
# Amplify 상태 확인
npx ampx status

# 출력 파일 확인
cat amplify_outputs.json
```

### 2. 주요 엔드포인트 확인
- **GraphQL API**: `amplify_outputs.json`의 `data.url`
- **User Pool ID**: `amplify_outputs.json`의 `auth.user_pool_id`
- **Identity Pool ID**: `amplify_outputs.json`의 `auth.identity_pool_id`

### 3. AWS 콘솔에서 확인
- [AWS Amplify 콘솔](https://console.aws.amazon.com/amplify/)
- [AWS AppSync 콘솔](https://console.aws.amazon.com/appsync/)
- [AWS Cognito 콘솔](https://console.aws.amazon.com/cognito/)

## 문제 해결

### 일반적인 문제들

1. **의존성 설치 실패**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **빌드 실패**
   ```bash
   npm run build
   # TypeScript 오류 확인
   npx tsc --noEmit
   ```

3. **배포 실패**
   ```bash
   # AWS 자격 증명 확인
   aws sts get-caller-identity
   
   # Amplify CLI 재설치
   npm install -g @aws-amplify/cli
   ```

4. **권한 오류**
   ```bash
   chmod +x deploy.sh
   chmod +x quick-deploy.sh
   ```

## 환경 변수 설정

프로덕션 배포 전에 필요한 환경 변수들을 확인하세요:

```bash
# AWS 자격 증명
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-west-2

# 또는 AWS CLI 설정
aws configure
```

## 모니터링

### 로그 확인
```bash
# 실시간 로그
npx ampx logs --follow

# 특정 시간대 로그
npx ampx logs --since 1h
```

### 성능 모니터링
- AWS CloudWatch에서 메트릭 확인
- AWS X-Ray으로 추적 확인
- Amplify 콘솔에서 빌드 로그 확인
