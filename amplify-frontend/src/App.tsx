import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
// import { Amplify } from 'aws-amplify'
// import { Authenticator } from '@aws-amplify/ui-react'
// import '@aws-amplify/ui-react/styles.css'

import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
// import { amplifyConfig } from './lib/amplify'

// Configure Amplify (임시로 비활성화)
// Amplify.configure(amplifyConfig)

// 임시 사용자 데이터
const mockUser = {
  username: 'demo-user',
  email: 'demo@example.com'
}

const mockSignOut = () => {
  console.log('로그아웃 (실제 구현 필요)')
}

function App() {
  return (
    <Router>
      <Layout user={mockUser} signOut={mockSignOut}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
