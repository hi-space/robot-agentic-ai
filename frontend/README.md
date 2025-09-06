# AI Agent Assistant Frontend

React 19 기반의 AI 에이전트 어시스턴트 웹 프론트엔드입니다.

## 주요 기능

### 🎯 사용자 인터페이스
- **텍스트 입력**: 실시간 채팅 인터페이스
- **음성 입력**: 마이크를 통한 음성 녹음 및 텍스트 변환
- **추천 명령어**: 자주 사용하는 명령어 버튼 제공
- **실시간 응답**: SSE(Server-Sent Events)를 통한 실시간 AI 응답

### 🎨 UI/UX 특징
- **모던 디자인**: Material-UI 기반의 깔끔하고 직관적인 인터페이스
- **반응형 레이아웃**: 다양한 화면 크기에 최적화
- **실시간 상태 표시**: 연결 상태, 타이핑 상태, 로딩 상태 시각화
- **그라데이션 배경**: 아름다운 그라데이션 배경과 카드 디자인

### 🔧 기술 스택
- **React 19**: 최신 React 기능 활용
- **TypeScript**: 타입 안전성 보장
- **Material-UI**: 모던 UI 컴포넌트
- **SSE**: 실시간 통신을 위한 Server-Sent Events
- **Axios**: HTTP 클라이언트

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가하세요:
```
REACT_APP_API_URL=http://localhost:8000
```

### 3. 개발 서버 실행
```bash
npm start
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 프로젝트 구조

```
src/
├── components/           # React 컴포넌트
│   ├── ChatInterface.tsx    # 메인 채팅 인터페이스
│   ├── MessageBubble.tsx    # 메시지 버블 컴포넌트
│   ├── RecommendedCommands.tsx # 추천 명령어 컴포넌트
│   └── VoiceRecorder.tsx     # 음성 녹음 컴포넌트
├── services/            # API 서비스
│   ├── ApiService.ts        # REST API 통신
│   └── SSEService.ts        # SSE 실시간 통신
├── types/               # TypeScript 타입 정의
│   └── Message.ts           # 메시지 타입
└── App.tsx              # 메인 앱 컴포넌트
```

## API 엔드포인트

### REST API
- `POST /api/chat` - 텍스트 메시지 전송
- `POST /api/voice` - 음성 메시지 전송
- `GET /api/commands/recommended` - 추천 명령어 조회

### SSE 엔드포인트
- `GET /api/stream` - 실시간 이벤트 스트림
- `POST /api/chat/stream` - 스트리밍 채팅
- `POST /api/voice/stream` - 스트리밍 음성 처리

## 주요 컴포넌트

### ChatInterface
메인 채팅 인터페이스로 다음 기능을 제공합니다:
- 메시지 목록 표시
- 텍스트 입력 및 전송
- 음성 녹음 및 전송
- 실시간 응답 표시

### VoiceRecorder
음성 녹음 기능을 제공합니다:
- 마이크 권한 요청
- 실시간 녹음 상태 표시
- 녹음 시간 카운터
- 음성 데이터 처리

### SSEService
실시간 통신을 위한 SSE 서비스:
- 자동 재연결
- 메시지 스트리밍
- 연결 상태 관리
- 오류 처리

## 개발 가이드

### 새로운 기능 추가
1. `src/components/`에 새 컴포넌트 생성
2. `src/types/`에 필요한 타입 정의
3. `src/services/`에 API 서비스 추가
4. `App.tsx`에서 새 기능 통합

### 스타일링
Material-UI의 `sx` prop을 사용하여 스타일링합니다:
```tsx
<Box sx={{ 
  display: 'flex', 
  flexDirection: 'column',
  gap: 2 
}}>
```

### 상태 관리
React의 `useState`와 `useRef`를 사용하여 상태를 관리합니다:
```tsx
const [messages, setMessages] = useState<Message[]>([]);
const apiService = useRef(new ApiService());
```

## 배포

### 프로덕션 빌드
```bash
npm run build
```

### 환경 변수 설정
프로덕션 환경에서는 다음 환경 변수를 설정하세요:
- `REACT_APP_API_URL`: 백엔드 API 서버 URL

## 문제 해결

### 마이크 권한 오류
브라우저에서 마이크 권한을 허용해야 음성 녹음이 가능합니다.

### SSE 연결 오류
백엔드 서버가 실행 중인지 확인하고, CORS 설정이 올바른지 확인하세요.

### 빌드 오류
TypeScript 타입 오류가 있는지 확인하고, 모든 의존성이 설치되었는지 확인하세요.

## 라이선스

MIT License