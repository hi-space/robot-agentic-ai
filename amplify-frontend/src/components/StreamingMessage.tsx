import React, { useState, useEffect, memo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material'
import {
  SmartToy as RobotIcon,
  Build as ToolIcon,
  Psychology as ReasoningIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Code as CodeIcon,
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'

// 타입 정의
export interface StreamMessage {
  id: string
  type: 'chunk' | 'tool_use' | 'reasoning' | 'complete' | 'metadata' | 'error'
  data?: string
  tool_name?: string
  tool_input?: any
  tool_id?: string
  reasoning_text?: string
  final_response?: string
  metadata?: any
  error?: string
  timestamp: Date
  isComplete?: boolean
  isUser?: boolean
}

interface StreamingMessageProps {
  message: StreamMessage
  isUser: boolean
  onUpdate?: (updatedMessage: StreamMessage) => void
}

// 스타일드 컴포넌트
const MessageContainer = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isUser',
})<{ isUser: boolean }>(({ theme, isUser }) => ({
  padding: '12px 16px',
  borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
  backgroundColor: isUser ? 'transparent' : 'transparent',
  background: isUser 
    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
    : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
  color: isUser ? 'white' : theme.palette.text.primary,
  maxWidth: '100%',
  marginBottom: '8px',
  wordWrap: 'break-word',
  border: isUser ? 'none' : `1px solid rgba(226, 232, 240, 0.8)`,
  boxShadow: isUser 
    ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    : '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}))

const ToolUseContainer = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  border: `1px solid rgba(6, 182, 212, 0.3)`,
  borderRadius: 12,
  padding: 16,
  margin: '8px 0',
  color: 'white',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  '& .tool-header': {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  '& .tool-content': {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    maxHeight: 200,
    overflow: 'auto',
    marginTop: 8,
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
}))

const ReasoningContainer = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  border: `1px solid rgba(245, 158, 11, 0.3)`,
  borderRadius: 12,
  padding: 16,
  margin: '8px 0',
  color: 'white',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  '& .reasoning-header': {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
}))

const ErrorContainer = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  border: `1px solid rgba(239, 68, 68, 0.3)`,
  borderRadius: 12,
  padding: 16,
  margin: '8px 0',
  color: 'white',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  '& .error-header': {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
}))

const StreamingText = styled(Typography)({
  minHeight: '1.2em', 
})

function StreamingMessage({ message, isUser, onUpdate }: StreamingMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [displayText, setDisplayText] = useState('')

  // 스트리밍 상태 결정
  const isStreaming = message.type === 'chunk' && !message.isComplete
  
  // 메시지 데이터가 변경될 때마다 displayText 업데이트 (깜빡거림 방지)
  useEffect(() => {
    const newDisplayText = message.type === 'complete' && message.final_response 
      ? message.final_response 
      : message.data || ''
    
    if (newDisplayText !== displayText) {
      setDisplayText(newDisplayText)
    }
  }, [message.data, message.final_response, message.type])

  // 도구 사용 정보 렌더링
  const renderToolUse = () => (
    <ToolUseContainer>
      <Box className="tool-header">
        <ToolIcon sx={{ color: 'white' }} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'white' }}>
          도구 사용: {message.tool_name || 'Unknown Tool'}
        </Typography>
        <Chip 
          label="실행중" 
          size="small" 
          sx={{ 
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            '& .MuiChip-label': {
              color: 'white',
            }
          }}
        />
        <IconButton
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ 
            ml: 'auto',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={isExpanded}>
        <Box className="tool-content">
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {typeof message.tool_input === 'string' 
              ? message.tool_input 
              : JSON.stringify(message.tool_input, null, 2)
            }
          </Typography>
        </Box>
      </Collapse>
    </ToolUseContainer>
  )

  // 추론 과정 렌더링
  const renderReasoning = () => (
    <ReasoningContainer>
      <Box className="reasoning-header">
        <ReasoningIcon sx={{ color: 'white' }} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'white' }}>
          AI 추론 과정
        </Typography>
        <IconButton
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ 
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={isExpanded}>
        <Typography variant="body2" sx={{ color: 'white' }}>
          {message.reasoning_text}
        </Typography>
      </Collapse>
    </ReasoningContainer>
  )

  // 에러 렌더링
  const renderError = () => (
    <ErrorContainer>
      <Box className="error-header">
        <ErrorIcon sx={{ color: 'white' }} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'white' }}>
          오류 발생
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'white' }}>
        {message.error}
      </Typography>
    </ErrorContainer>
  )

  // 완료 상태 렌더링
  const renderComplete = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
      <CompleteIcon sx={{ color: '#10b981', fontSize: 'small' }} />
      <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
        응답 완료
      </Typography>
    </Box>
  )

  // 메인 컨텐츠 렌더링
  const renderContent = () => {
    switch (message.type) {
      case 'tool_use':
        return renderToolUse()
      case 'reasoning':
        return renderReasoning()
      case 'error':
        return renderError()
      case 'complete':
        return (
          <Box>
            <StreamingText 
              variant="body2" 
              sx={{ 
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {displayText}
            </StreamingText>
            {renderComplete()}
          </Box>
        )
      case 'chunk':
      default:
        return (
          <StreamingText 
            variant="body2" 
            sx={{ 
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {displayText}
          </StreamingText>
        )
    }
  }

  // 사용자 메시지인지 확인 (간단한 텍스트인 경우)
  const isSimpleUserMessage = isUser && message.type === 'chunk' && !message.tool_name && !message.reasoning_text && !message.error

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, maxWidth: '85%' }}>
        {!isUser && (
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <RobotIcon />
          </Avatar>
        )}
        <Box sx={{ width: '100%' }}>
          {isSimpleUserMessage ? (
            // 사용자 메시지는 기존 스타일 유지
            <MessageContainer isUser={isUser}>
              {renderContent()}
            </MessageContainer>
          ) : (
            // AI 메시지는 더 깔끔한 스타일로 표시
            <Box sx={{ 
              p: 2, 
              background: isUser 
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              color: isUser ? 'white' : 'text.primary',
              borderRadius: isUser ? '20px 20px 4px 20px' : 0,
              border: isUser ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: isUser 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                : '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              wordWrap: 'break-word',
            }}>
              {renderContent()}
            </Box>
          )}
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              ml: isUser ? 0 : 1,
              mr: isUser ? 1 : 0,
              display: 'block',
              mt: 0.5
            }}
          >
            {message.timestamp.toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit',
              hour12: false 
            })}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

// memo 비교 함수 추가하여 불필요한 리렌더링 방지
export default memo(StreamingMessage, (prevProps, nextProps) => {
  // 메시지 내용이 동일한지 확인
  const prevMessage = prevProps.message
  const nextMessage = nextProps.message
  
  return (
    prevMessage.id === nextMessage.id &&
    prevMessage.type === nextMessage.type &&
    prevMessage.data === nextMessage.data &&
    prevMessage.final_response === nextMessage.final_response &&
    prevMessage.tool_name === nextMessage.tool_name &&
    prevMessage.tool_input === nextMessage.tool_input &&
    prevMessage.reasoning_text === nextMessage.reasoning_text &&
    prevMessage.error === nextMessage.error &&
    prevMessage.isComplete === nextMessage.isComplete &&
    prevMessage.isUser === nextMessage.isUser &&
    prevProps.isUser === nextProps.isUser
  )
})
