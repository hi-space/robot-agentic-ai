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
  useTheme,
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
import JsonView from '@uiw/react-json-view'

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
  background: 'linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)',
  border: `1px solid rgba(148, 163, 184, 0.3)`,
  borderRadius: 12,
  padding: 12,
  margin: '8px 0',
  color: theme.palette.text.primary,
  boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transform: 'translateY(-1px)',
  },
  '& .tool-header': {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  '& .tool-content': {
    background: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 8,
    padding: 8,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    fontSize: '0.875rem',
    maxHeight: 200,
    overflow: 'auto',
    marginTop: 8,
    color: theme.palette.text.primary,
    border: '1px solid rgba(99, 102, 241, 0.15)',
    backdropFilter: 'blur(10px)',
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

// 키프레임 애니메이션 정의
const keyframes = `
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
`

function StreamingMessage({ message, isUser, onUpdate }: StreamingMessageProps) {
  const theme = useTheme()
  
  // tool_use 메시지는 기본적으로 펼쳐져 있도록 설정
  const [isExpanded, setIsExpanded] = useState(true)
  const [displayText, setDisplayText] = useState('')
  const [displayToolInput, setDisplayToolInput] = useState('')

  // 키프레임 애니메이션을 head에 주입
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = keyframes
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

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

  // tool_input이 변경될 때마다 displayToolInput 업데이트 (스트리밍 효과)
  useEffect(() => {
    if (message.type === 'tool_use') {
      let newToolInput = message.tool_input
      
      console.log('Tool input update:', { 
        tool_input: message.tool_input, 
        newToolInput, 
        displayToolInput,
        messageId: message.id 
      })
      
      if (newToolInput !== displayToolInput) {
        setDisplayToolInput(newToolInput)
      }
    }
  }, [message.tool_input, message.type, displayToolInput])

  // JSON 데이터를 안전하게 파싱하는 함수
  const parseJSONSafely = (data: any): any => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data)
      } catch (e) {
        // JSON이 완전하지 않은 경우 원본 문자열 반환
        return data
      }
    }
    return data
  }

  // 도구 사용 정보 렌더링
  const renderToolUse = () => {
    // toolInput이 없거나 비어있으면 접힌 상태로 시작
    const hasToolInput = displayToolInput && displayToolInput !== '' && displayToolInput !== null && displayToolInput !== undefined

    return (
      <ToolUseContainer>
        <Box className="tool-header">
          <ToolIcon sx={{ color: theme.palette.primary.main }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: theme.palette.text.primary }}>
              {message.tool_name || 'Unknown Tool'}
            </Typography>
            {message.tool_id && (
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                {message.tool_id}
              </Typography>
            )}
          </Box>
          <Chip 
            label={message.isComplete ? "완료" : "실행중"} 
            size="small" 
            sx={{ 
              background: message.isComplete 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(99, 102, 241, 0.1)',
              color: message.isComplete 
                ? theme.palette.success.main
                : theme.palette.primary.main,
              border: message.isComplete 
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.75rem',
              '& .MuiChip-label': {
                color: message.isComplete 
                  ? theme.palette.success.main
                  : theme.palette.primary.main,
                fontWeight: 600,
              }
            }}
          />
          {hasToolInput && (
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{ 
                ml: 'auto',
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: theme.palette.primary.main,
                }
              }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>
        {hasToolInput && (
          <Collapse in={isExpanded}>
            <Box className="tool-content">
              <JsonView
                value={parseJSONSafely(displayToolInput)}
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                }}
                displayDataTypes={false}
                displayObjectSize={false}
                enableClipboard={false}
                collapsed={false}
              />
            </Box>
          </Collapse>
        )}
      </ToolUseContainer>
    )
  }

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
        <Typography variant="body1" sx={{ color: 'white' }}>
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
      <Typography variant="body1" sx={{ color: 'white' }}>
        {message.error}
      </Typography>
    </ErrorContainer>
  )

  // 완료 상태 렌더링
  const renderComplete = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
      <CompleteIcon sx={{ color: '#10b981', fontSize: 'small' }} />
      <Typography variant="subtitle2" sx={{ color: '#10b981', fontWeight: 600 }}>
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
              variant="body1" 
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
            variant="body1" 
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
  
  // tool_use, reasoning, error 타입은 자체 스타일링이 있으므로 추가 박스 불필요
  const hasCustomStyling = message.type === 'tool_use' || message.type === 'reasoning' || message.type === 'error'

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
          ) : hasCustomStyling ? (
            // tool_use, reasoning, error는 자체 스타일링 사용
            renderContent()
          ) : (
            // 일반 AI 메시지는 더 깔끔한 스타일로 표시
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
