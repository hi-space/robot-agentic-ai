import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Avatar,
  List,
  ListItem,
  Chip,
  LinearProgress,
  IconButton,
  Paper,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import {
  Send as SendIcon,
  SmartToy as RobotIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  PlayArrow as PlayIcon,
  LocalFireDepartment as FireIcon,
  GasMeter as GasIcon,
  Group as PersonPinIcon,
  DirectionsRun as DirectionsRunIcon,
  DirectionsWalk as DirectionsWalkIcon,
  SportsMartialArts as SportsMartialArtsIcon,
  Favorite as FavoriteIcon,
  Visibility as VisibilityIcon,
  Summarize as SummarizeIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { invokeAgentCore, processAgentCoreStream, validateEnvironment } from '../lib/BedrockAgentCore'

// 타입 정의
interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface Task {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress?: number
  timestamp: Date
}

interface AgentCoreStatus {
  isConnected: boolean
  isLoading: boolean
  error: string | null
}

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

const ChatBubble = styled(Paper, {
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
}))

export default function Dashboard() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: '안녕하세요! Robot Agentic AI입니다. 무엇을 도와드릴까요?',
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [agentCoreStatus, setAgentCoreStatus] = useState<AgentCoreStatus>({
    isConnected: false,
    isLoading: false,
    error: null,
  })
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      name: '로봇 이동 명령',
      status: 'in_progress',
      progress: 75,
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
    },
    {
      id: '2',
      name: 'AI 명령 분석',
      status: 'completed',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: '3',
      name: '센서 데이터 수집',
      status: 'pending',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      id: '4',
      name: '장애물 회피',
      status: 'failed',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      id: '5',
      name: '사용자 응답 생성',
      status: 'completed',
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
    },
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // AgentCore 연결 상태 확인
  useEffect(() => {
    const checkAgentCoreConnection = async () => {
      setAgentCoreStatus(prev => ({ ...prev, isLoading: true, error: null }))
      
      try {
        const isValid = validateEnvironment()
        if (!isValid) {
          throw new Error('환경 변수가 올바르게 설정되지 않았습니다.')
        }
        
        setAgentCoreStatus({
          isConnected: true,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        setAgentCoreStatus({
          isConnected: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'AgentCore 연결 실패',
        })
      }
    }

    checkAgentCoreConnection()
  }, [])

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, newMessage])
    setInputText('')

    // AgentCore 연결 상태 확인
    if (!agentCoreStatus.isConnected) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'AgentCore에 연결할 수 없습니다. 환경 설정을 확인해주세요.',
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    // 로딩 메시지 추가
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: 'AI가 응답을 생성하고 있습니다...',
      isUser: false,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, loadingMessage])

    try {
      // AgentCore 호출
      const stream = await invokeAgentCore(text.trim(), currentSessionId)
      
      // 세션 ID 업데이트 (첫 번째 호출인 경우)
      if (!currentSessionId) {
        setCurrentSessionId(`session-${Date.now()}`)
      }

      let fullResponse = ''
      let isFirstChunk = true

      await processAgentCoreStream(
        stream,
        // onChunk: 스트리밍 텍스트 처리
        (chunk: string) => {
          if (isFirstChunk) {
            // 첫 번째 청크가 오면 로딩 메시지를 실제 응답으로 교체
            setMessages(prev => 
              prev.map(msg => 
                msg.id === loadingMessage.id 
                  ? { ...msg, text: chunk }
                  : msg
              )
            )
            isFirstChunk = false
          } else {
            // 이후 청크들은 기존 메시지에 추가
            setMessages(prev => 
              prev.map(msg => 
                msg.id === loadingMessage.id 
                  ? { ...msg, text: msg.text + chunk }
                  : msg
              )
            )
          }
          fullResponse += chunk
        },
        // onToolUse: 도구 사용 정보 처리
        (toolName: string, toolInput: any) => {
          console.log(`도구 사용: ${toolName}`, toolInput)
        },
        // onReasoning: 추론 과정 처리
        (reasoning: string) => {
          console.log('AI 추론:', reasoning)
        },
        // onComplete: 최종 응답 처리
        (finalResponse: string) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === loadingMessage.id 
                ? { ...msg, text: finalResponse }
                : msg
            )
          )
        },
        // onError: 에러 처리
        (error: string) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === loadingMessage.id 
                ? { ...msg, text: `오류가 발생했습니다: ${error}` }
                : msg
            )
          )
        }
      )

    } catch (error) {
      console.error('AgentCore 호출 오류:', error)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { 
                ...msg, 
                text: `AgentCore 호출 중 오류가 발생했습니다: ${
                  error instanceof Error ? error.message : '알 수 없는 오류'
                }` 
              }
            : msg
        )
      )
    }
  }

  const handleButtonClick = (command: string) => {
    handleSendMessage(command)
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: '1',
        text: '안녕하세요! Robot Agentic AI입니다. 무엇을 도와드릴까요?',
        isUser: false,
        timestamp: new Date(),
      },
    ])
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />
      case 'in_progress':
        return <PlayIcon />
      case 'pending':
        return <ScheduleIcon />
      case 'failed':
        return <ErrorIcon />
      default:
        return null
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in_progress':
        return 'primary'
      case 'pending':
        return 'warning'
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    })
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 64px)', 
      bgcolor: 'grey.50',
      width: '100%',
      px: { xs: 2, sm: 3, md: 4 },
      py: 3
    }}>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3, 
        flexGrow: 1, 
        minHeight: 0,
        height: '100%',
        maxWidth: '2000px',
        mx: 'auto',
        width: '100%'
      }}>
        {/* 왼쪽 패널 - 제어 버튼들 */}
        <Box sx={{ 
          width: { xs: '100%', md: '380px' }, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2, 
          height: { xs: 'auto', md: '100%' },
          flex: { xs: '0 0 auto', md: '0 0 280px' }
        }}>
          {/* 대화 리셋 버튼 */}
          <StyledCard sx={{ flex: '0 0 auto' }}>
            <CardContent sx={{ p: 2 }}>
              <StyledButton
                variant="outlined"
                color="secondary"
                fullWidth
                startIcon={<RefreshIcon />}
                onClick={handleResetChat}
                sx={{ 
                  fontSize: '0.875rem', 
                  py: 1.5,
                  borderColor: 'error.main',
                  color: 'error.main',
                  '&:hover': {
                    borderColor: 'error.dark',
                    backgroundColor: 'error.light',
                    color: 'error.dark'
                  }
                }}
              >
                대화내용 리셋
              </StyledButton>
            </CardContent>
          </StyledCard>

          {/* 로봇 제어 패널 */}
          <StyledCard sx={{ flex: '0 0 auto' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
                로봇 제어
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                {[
                  { text: '앉아', icon: <DirectionsRunIcon />, color: 'primary' },
                  { text: '일어서', icon: <DirectionsWalkIcon />, color: 'primary' },
                  { text: '뒹굴어', icon: <SportsMartialArtsIcon />, color: 'secondary' },
                  { text: '춤춰', icon: <SportsMartialArtsIcon />, color: 'success' },
                  { text: '하트해', icon: <FavoriteIcon />, color: 'error' },
                  { text: '돌아와', icon: <HomeIcon />, color: 'info' },
                ].map((button, index) => (
                  <StyledButton
                    key={index}
                    variant="contained"
                    color={button.color as any}
                    fullWidth
                    startIcon={button.icon}
                    onClick={() => handleButtonClick(button.text)}
                    sx={{ fontSize: '0.8rem', py: 1.5 }}
                  >
                    {button.text}
                  </StyledButton>
                ))}
              </Box>
            </CardContent>
          </StyledCard>

          {/* 채팅 패널 */}
          <StyledCard sx={{ flex: '0 0 auto' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
                빠른 명령
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { text: '위험 상황 감시해줘', icon: <VisibilityIcon /> },
                  { text: '어떤 일들이 있었는지 요약해줘', icon: <SummarizeIcon /> },
                  { text: '모든 감시가 끝났으니 돌아와', icon: <HomeIcon /> }
                ].map((item, index) => (
                  <StyledButton
                    key={index}
                    variant="outlined"
                    fullWidth
                    startIcon={item.icon}
                    onClick={() => handleButtonClick(item.text)}
                    sx={{ fontSize: '0.8rem', textAlign: 'left', py: 1.5 }}
                  >
                    {item.text}
                  </StyledButton>
                ))}
              </Box>
            </CardContent>
          </StyledCard>

          {/* 이슈 제기 패널 */}
          <StyledCard sx={{ flex: '0 0 auto' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
                긴급 신고
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { text: '화재 발생', icon: <FireIcon />, color: 'error' },
                  { text: '가스 유출', icon: <GasIcon />, color: 'warning' },
                  { text: '작업자 사고 감지', icon: <PersonPinIcon />, color: 'info' },
                ].map((item, index) => (
                  <StyledButton
                    key={index}
                    variant="contained"
                    color={item.color as any}
                    fullWidth
                    startIcon={item.icon}
                    onClick={() => handleButtonClick(item.text)}
                    sx={{ fontSize: '0.8rem', py: 1.5 }}
                  >
                    {item.text}
                  </StyledButton>
                ))}
              </Box>
            </CardContent>
          </StyledCard>
        </Box>

        {/* 중앙 패널 - 채팅 인터페이스 */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minWidth: { xs: '100%', md: '800px' },
          minHeight: 0,
          height: { xs: '400px', md: '100%' }
        }}>
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
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, maxWidth: '85%' }}>
                    {!message.isUser && (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        <RobotIcon />
                      </Avatar>
                    )}
                    <Box>
                      <ChatBubble isUser={message.isUser}>
                        <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                          {message.text}
                        </Typography>
                      </ChatBubble>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                          ml: message.isUser ? 0 : 1,
                          mr: message.isUser ? 1 : 0,
                          display: 'block',
                          mt: 0.5
                        }}
                      >
                        {formatTime(message.timestamp)}
                      </Typography>
                    </Box>
                    {/* {message.isUser && (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.600' }}>
                        <PersonIcon />
                      </Avatar>
                    )} */}
                  </Box>
                </Box>
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
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage(inputText)
                    }
                  }}
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
                  onClick={() => handleSendMessage(inputText)}
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
        </Box>

        {/* 오른쪽 패널 - 작업 상태 */}
        <Box sx={{ 
          width: { xs: '100%', md: '380px' }, 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 0,
          height: { xs: 'auto', md: '100%' },
          flex: { xs: '0 0 auto', md: '0 0 280px' }
        }}>
          <StyledCard sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
                작업 현황
              </Typography>
              <List sx={{ p: 0, flex: 1, overflow: 'auto' }}>
                {tasks.map((task, index) => (
                  <React.Fragment key={task.id}>
                    <ListItem sx={{ px: 0, py: 1.5, flexDirection: 'column', alignItems: 'stretch' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, flexGrow: 1, fontSize: '0.875rem' }}>
                          {task.name}
                        </Typography>
                        <Box sx={{ color: getStatusColor(task.status) === 'success' ? 'success.main' : 
                                          getStatusColor(task.status) === 'error' ? 'error.main' :
                                          getStatusColor(task.status) === 'warning' ? 'warning.main' : 'primary.main' }}>
                          {getStatusIcon(task.status)}
                        </Box>
                      </Box>
                      
                      {task.progress !== undefined && (
                        <Box sx={{ mb: 1.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={task.progress}
                            sx={{ 
                              height: 4, 
                              borderRadius: 2,
                              bgcolor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 2
                              }
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                            {task.progress}%
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Chip
                          label={task.status === 'in_progress' ? '진행중' : 
                                 task.status === 'completed' ? '완료' :
                                 task.status === 'pending' ? '대기' : '실패'}
                          color={getStatusColor(task.status) as any}
                          size="small"
                          variant={task.status === 'pending' ? 'outlined' : 'filled'}
                          sx={{ fontSize: '0.75rem', height: 24 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {formatTime(task.timestamp)}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < tasks.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </StyledCard>
        </Box>
      </Box>
    </Box>
  )
}
