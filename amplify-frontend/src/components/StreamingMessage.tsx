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
  borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[50],
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  maxWidth: '100%',
  marginBottom: '8px',
  wordWrap: 'break-word',
  border: isUser ? 'none' : `1px solid ${theme.palette.divider}`,
  position: 'relative',
}))

const ToolUseContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.info.light,
  border: `1px solid ${theme.palette.info.main}`,
  borderRadius: 8,
  padding: 12,
  margin: '8px 0',
  '& .tool-header': {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  '& .tool-content': {
    backgroundColor: theme.palette.background.paper,
    borderRadius: 4,
    padding: 8,
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    maxHeight: 200,
    overflow: 'auto',
    marginTop: 8,
  },
}))

const ReasoningContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.warning.light,
  border: `1px solid ${theme.palette.warning.main}`,
  borderRadius: 8,
  padding: 12,
  margin: '8px 0',
  '& .reasoning-header': {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
}))

const ErrorContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.error.light,
  border: `1px solid ${theme.palette.error.main}`,
  borderRadius: 8,
  padding: 12,
  margin: '8px 0',
  '& .error-header': {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
}))

const StreamingText = styled(Typography)({
  // 커서 제거
  minHeight: '1.2em', // 최소 높이 보장
  transition: 'all 0.1s ease-in-out', // 부드러운 업데이트
  '&.typing': {
    animation: 'pulse 0.5s ease-in-out',
  },
  '@keyframes pulse': {
    '0%': { opacity: 0.7 },
    '50%': { opacity: 1 },
    '100%': { opacity: 0.7 },
  },
})

const StreamingMessage = memo(function StreamingMessage({ message, isUser, onUpdate }: StreamingMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // 스트리밍 상태 결정
  const isStreaming = message.type === 'chunk' && !message.isComplete
  
  // 메시지 데이터가 변경될 때마다 displayText 업데이트
  useEffect(() => {
    const newDisplayText = message.type === 'complete' && message.final_response 
      ? message.final_response 
      : message.data || ''
    
    if (newDisplayText !== displayText) {
      setIsTyping(true)
      setDisplayText(newDisplayText)
      
      // 타이핑 효과를 위한 짧은 지연
      const timer = setTimeout(() => {
        setIsTyping(false)
      }, 50)
      
      return () => clearTimeout(timer)
    }
  }, [message.data, message.final_response, message.type])

  // 도구 사용 정보 렌더링
  const renderToolUse = () => (
    <ToolUseContainer>
      <Box className="tool-header">
        <ToolIcon color="info" />
        <Typography variant="subtitle2" fontWeight={600}>
          도구 사용: {message.tool_name || 'Unknown Tool'}
        </Typography>
        <Chip 
          label="실행중" 
          size="small" 
          color="info" 
          variant="outlined"
        />
        <IconButton
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ ml: 'auto' }}
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
        <ReasoningIcon color="warning" />
        <Typography variant="subtitle2" fontWeight={600}>
          AI 추론 과정
        </Typography>
        <IconButton
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={isExpanded}>
        <Typography variant="body2">
          {message.reasoning_text}
        </Typography>
      </Collapse>
    </ReasoningContainer>
  )

  // 에러 렌더링
  const renderError = () => (
    <ErrorContainer>
      <Box className="error-header">
        <ErrorIcon color="error" />
        <Typography variant="subtitle2" fontWeight={600}>
          오류 발생
        </Typography>
      </Box>
      <Typography variant="body2">
        {message.error}
      </Typography>
    </ErrorContainer>
  )

  // 완료 상태 렌더링
  const renderComplete = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
      <CompleteIcon color="success" fontSize="small" />
      <Typography variant="caption" color="success.main">
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
              className={isTyping ? 'typing' : ''}
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
            className={isTyping ? 'typing' : ''}
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
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
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
              bgcolor: isUser ? 'primary.main' : 'transparent',
              color: isUser ? 'primary.contrastText' : 'text.primary',
              borderRadius: isUser ? '18px 18px 4px 18px' : 0,
              border: isUser ? 'none' : 'none',
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
})

export default StreamingMessage
