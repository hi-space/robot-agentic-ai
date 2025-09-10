import React, { useRef, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Avatar,
  Chip,
  IconButton,
  Alert,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import {
  Send as SendIcon,
  SmartToy as RobotIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import StreamingMessage from './StreamingMessage'
import { StreamMessage } from './StreamingMessage'

// 스타일드 컴포넌트
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    borderColor: theme.palette.primary.light,
  },
}))

const StyledButton = styled(Button)(() => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 500,
  padding: '8px 16px',
  transition: 'all 0.2s ease',
  fontSize: '0.875rem',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
}))

interface AgentCoreStatus {
  isConnected: boolean
  isLoading: boolean
  error: string | null
}

interface ChatInterfaceProps {
  messages: StreamMessage[]
  inputText: string
  setInputText: (text: string) => void
  onSendMessage: (text: string) => void
  onResetChat: () => void
  agentCoreStatus: AgentCoreStatus
}

export default function ChatInterface({
  messages,
  inputText,
  setInputText,
  onSendMessage,
  onResetChat,
  agentCoreStatus,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSendMessage(inputText)
    }
  }

  return (
    <StyledCard sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* 채팅 헤더 */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        bgcolor: 'white',
        borderRadius: '12px 12px 0 0'
      }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
          <RobotIcon />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            Robot AgenticAI
          </Typography>
          <Typography variant="caption" color="text.secondary">
            AI를 통해 실시간 로봇 제어 및 모니터링
          </Typography>
        </Box>
        <Chip 
          label={agentCoreStatus.isLoading ? "연결중..." : 
                 agentCoreStatus.isConnected ? "온라인" : "오프라인"} 
          color={agentCoreStatus.isLoading ? "warning" : 
                 agentCoreStatus.isConnected ? "success" : "error"} 
          size="small" 
          sx={{ ml: 'auto' }} 
        />
        <IconButton
          onClick={onResetChat}
          size="small"
          sx={{ 
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'error.light',
            }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* AgentCore 연결 오류 알림 */}
      {agentCoreStatus.error && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              AgentCore 연결 오류: {agentCoreStatus.error}
            </Typography>
          </Alert>
        </Box>
      )}

      {/* 채팅 메시지 영역 */}
      <Box sx={{ 
        flex: 1, 
        p: 2, 
        overflow: 'auto', 
        minHeight: 0,
        bgcolor: 'grey.50'
      }}>
        {messages.map((message) => (
          <StreamingMessage
            key={message.id}
            message={message}
            isUser={message.isUser ?? false}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* 입력 영역 - 패널 하단 고정 */}
      <Box sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        bgcolor: 'white',
        borderRadius: '0 0 12px 12px'
      }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            placeholder="메시지를 입력하세요..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            multiline
            maxRows={3}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2,
                bgcolor: 'grey.50'
              } 
            }}
          />
          <IconButton
            color="primary"
            onClick={() => onSendMessage(inputText)}
            disabled={!inputText.trim()}
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white', 
              width: 40,
              height: 40,
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'grey.300' }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </StyledCard>
  )
}
