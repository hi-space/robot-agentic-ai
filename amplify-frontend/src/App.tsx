import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
// import { Amplify } from 'aws-amplify'
// import { Authenticator } from '@aws-amplify/ui-react'
// import '@aws-amplify/ui-react/styles.css'

import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Agent from './pages/Agent'
// import { amplifyConfig } from './lib/amplify'

// Configure Amplify (임시로 비활성화)
// Amplify.configure(amplifyConfig)

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
