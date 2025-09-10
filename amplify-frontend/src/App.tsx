import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Amplify } from 'aws-amplify'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { useEffect, useState } from 'react'

import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Agent from './pages/Agent'
import { amplifyConfig } from './lib/amplify'
import { initializeEnvConfig } from './lib/env-config'

// Configure Amplify
Amplify.configure(amplifyConfig)

function App() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize environment configuration and authentication
    const initializeApp = async () => {
      try {
        console.log('앱 초기화 시작...')
        
        // 환경 설정 초기화
        await initializeEnvConfig()
        console.log('환경 설정 초기화 완료')
        
        // Cognito 인증 상태 확인
        try {
          const { fetchAuthSession } = await import('aws-amplify/auth')
          const session = await fetchAuthSession()
          
        } catch (authError) {
          console.log('인증되지 않은 상태 - 로그인 필요')
        }
        
        setIsInitialized(true)
        console.log('앱 초기화 완료')
      } catch (error) {
        console.error('앱 초기화 실패:', error)
        setIsInitialized(true) // 에러가 있어도 앱은 계속 실행
      }
    }

    initializeApp()
  }, [])

  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        앱을 초기화하는 중...
      </div>
    )
  }

  return (
    <Authenticator>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Layout>
      </Router>
    </Authenticator>
  )
}

export default App
