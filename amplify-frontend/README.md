# Amplify Frontend

React 19, TypeScript, AWS Amplify를 사용한 현대적인 웹 애플리케이션입니다.

## 기술 스택

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: AWS Amplify (Auth, GraphQL API)
- **Testing**: Vitest, Testing Library
- **Linting**: ESLint, TypeScript ESLint

## 주요 기능

- 🔐 AWS Amplify를 통한 사용자 인증
- 📱 반응형 디자인 (Tailwind CSS)
- 🚀 빠른 개발 환경 (Vite)
- 🧪 테스트 환경 구성 (Vitest)
- 📊 대시보드 및 프로필 관리
- 🎨 현대적인 UI/UX

## 시작하기

### 1. 의존성 설치

```bash
npm install
# 또는
yarn install
```

### 2. 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
```

개발 서버가 http://localhost:3000에서 실행됩니다.

### 3. 빌드

```bash
npm run build
# 또는
yarn build
```

### 4. 테스트

```bash
npm run test
# 또는
yarn test
```

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   └── Layout.tsx      # 메인 레이아웃 컴포넌트
├── pages/              # 페이지 컴포넌트
│   ├── Home.tsx        # 홈 페이지
│   ├── Dashboard.tsx   # 대시보드 페이지
│   └── Profile.tsx     # 프로필 페이지
├── lib/                # 유틸리티 및 설정
│   ├── amplify.ts      # Amplify 설정
│   └── utils.ts        # 공통 유틸리티
├── test/               # 테스트 설정
│   └── setup.ts        # 테스트 환경 설정
├── App.tsx             # 메인 앱 컴포넌트
├── main.tsx            # 앱 진입점
└── index.css           # 글로벌 스타일
```

## AWS Amplify 설정

이 프로젝트는 AWS Amplify를 사용하여 인증과 API를 제공합니다. Amplify 설정은 `src/lib/amplify.ts`에서 확인할 수 있습니다.

### Amplify 백엔드 배포

```bash
npx ampx sandbox
```

## 개발 가이드

### 컴포넌트 작성

새로운 컴포넌트를 작성할 때는 TypeScript를 사용하고, Tailwind CSS로 스타일링하세요.

```tsx
import { cn } from '@/lib/utils'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
}

export function Button({ children, variant = 'primary', className }: ButtonProps) {
  return (
    <button
      className={cn(
        'btn',
        variant === 'primary' ? 'btn-primary' : 'btn-secondary',
        className
      )}
    >
      {children}
    </button>
  )
}
```

### 스타일링

Tailwind CSS의 유틸리티 클래스를 사용하세요. 공통 스타일은 `src/index.css`의 `@layer components`에서 정의되어 있습니다.

### 테스트 작성

Vitest와 Testing Library를 사용하여 컴포넌트 테스트를 작성하세요.

```tsx
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

test('renders button with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

## 라이선스

ISC
