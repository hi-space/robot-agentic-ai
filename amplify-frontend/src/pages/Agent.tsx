import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import {
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
import { invokeRobotControl, mapButtonTextToAction, isRobotControlButton, RobotAction } from '../lib/LambdaClient'
import ChatInterface from '../components/ChatInterface'
import { useStreamingMessages } from '../hooks/useStreamingMessages'
import robotControlMapping from '../config/robotControlButton.json'

// 아이콘 매핑 함수
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ReactElement } = {
    DirectionsRunIcon: <DirectionsRunIcon />,
    DirectionsWalkIcon: <DirectionsWalkIcon />,
    SportsMartialArtsIcon: <SportsMartialArtsIcon />,
    FavoriteIcon: <FavoriteIcon />,
    HomeIcon: <HomeIcon />,
    RefreshIcon: <RefreshIcon />,
    VisibilityIcon: <VisibilityIcon />,
    SummarizeIcon: <SummarizeIcon />,
    FireIcon: <FireIcon />,
    GasIcon: <GasIcon />,
    PersonPinIcon: <PersonPinIcon />,
  }
  return iconMap[iconName] || <DirectionsRunIcon />
}

// 타입 정의 

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

interface RobotControlStatus {
  isExecuting: boolean
  lastAction: string | null
  error: string | null
}

interface AIResponseStatus {
  isWaiting: boolean
  isProcessing: boolean
}

// 스타일드 컴포넌트
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    borderColor: theme.palette.primary.light,
    transform: 'translateY(-2px)',
  },
}))

const StyledButton = styled(Button)(() => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 500,
  padding: '8px 16px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  fontSize: '0.875rem',
  '&:hover': {
    transform: 'translateY(-2px) scale(1.02)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
  },
  '&:active': {
    transform: 'translateY(0) scale(0.98)',
  },
}))

// 반응형 컨테이너 스타일
const ResponsiveContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 64px)',
  backgroundColor: theme.palette.grey[50],
  width: '100%',
  padding: theme.spacing(3),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
  [theme.breakpoints.up('lg')]: {
    padding: theme.spacing(4),
  },
}))

// 반응형 메인 레이아웃
const MainLayout = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  flexGrow: 1,
  minHeight: 0,
  height: '100%',
  margin: '0 auto',
  width: '100%',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
  },
}))

// 반응형 사이드 패널
const SidePanel = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  height: 'auto',
  flex: '0 0 auto',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.up('sm')]: {
    width: '100%',
  },
  [theme.breakpoints.up('md')]: {
    width: '350px',
    height: '100%',
    flex: '0 0 350px',
  },
  [theme.breakpoints.up('lg')]: {
    width: '380px',
    flex: '0 0 380px',
  },
  [theme.breakpoints.up('xl')]: {
    width: '420px',
    flex: '0 0 420px',
  },
}))

// 반응형 채팅 패널
const ChatPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: '100%',
  minHeight: 0,
  height: '400px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.up('sm')]: {
    minWidth: '100%',
    height: '500px',
  },
  [theme.breakpoints.up('md')]: {
    minWidth: '500px',
    height: '100%',
  },
  [theme.breakpoints.up('lg')]: {
    minWidth: '700px',
  },
  [theme.breakpoints.up('xl')]: {
    minWidth: '900px',
  },
}))


export default function Dashboard() {
  const { messages, addMessage, updateMessage, appendToMessage, clearMessages } = useStreamingMessages()
  const [inputText, setInputText] = useState('')
  const [agentCoreStatus, setAgentCoreStatus] = useState<AgentCoreStatus>({
    isConnected: false,
    isLoading: false,
    error: null,
  })
  const [robotControlStatus, setRobotControlStatus] = useState<RobotControlStatus>({
    isExecuting: false,
    lastAction: null,
    error: null,
  })
  const [aiResponseStatus, setAiResponseStatus] = useState<AIResponseStatus>({
    isWaiting: false,
    isProcessing: false,
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
  // 초기 메시지 추가
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        type: 'chunk',
        data: '안녕하세요! Robot Agentic AI입니다. 무엇을 도와드릴까요?',
        isUser: false,
      })
    }
  }, [messages.length]) // addMessage 의존성 제거

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

    // AI 응답 대기 상태로 설정
    setAiResponseStatus({
      isWaiting: true,
      isProcessing: false,
    })

    // 사용자 메시지 추가
    const userMessageId = addMessage({
      type: 'chunk',
      data: text.trim(),
      isUser: true,
    })
    setInputText('')

    // AgentCore 연결 상태 확인
    if (!agentCoreStatus.isConnected) {
      setAiResponseStatus({
        isWaiting: false,
        isProcessing: false,
      })
      addMessage({
        type: 'error',
        error: 'AgentCore에 연결할 수 없습니다. 환경 설정을 확인해주세요.',
        isUser: false,
      })
      return
    }

    try {
      // AI 응답 처리 시작
      setAiResponseStatus({
        isWaiting: false,
        isProcessing: true,
      })

      // AgentCore 호출
      const stream = await invokeAgentCore(text.trim(), currentSessionId)
      
      // 세션 ID 업데이트 (첫 번째 호출인 경우)
      if (!currentSessionId) {
        setCurrentSessionId(`session-${Date.now()}`)
      }

      let isFirstChunk = true
      let currentMessageId = ''
      let lastMessageType: string | null = null

      await processAgentCoreStream(
        stream,
        // onChunk: 스트리밍 텍스트 처리
        (chunk: string) => {
          if (isFirstChunk) {
            // 첫 번째 청크가 오면 새 메시지 생성
            currentMessageId = addMessage({
              type: 'chunk',
              data: chunk,
              isUser: false,
            })
            lastMessageType = 'chunk'
            isFirstChunk = false
          } else {
            // 이후 청크들은 기존 메시지에 추가
            appendToMessage(currentMessageId, chunk)
          }
        },
        // onToolUse: 도구 사용 정보 처리
        (toolName: string, toolInput: any) => {
          console.log('Tool use received:', { toolName, toolInput, lastMessageType })
          if (lastMessageType === 'tool_use') {
            // 이전 메시지가 tool_use 타입이면 tool_input에 텍스트 추가
            const currentMessage = messages.find(msg => msg.id === currentMessageId)
            if (currentMessage) {
              const currentInput = currentMessage.tool_input || ''
              const newInput = typeof toolInput === 'string' 
                ? currentInput + toolInput 
                : toolInput
              console.log('Updating existing tool_use message:', { currentMessageId, newInput })
              updateMessage(currentMessageId, {
                tool_name: toolName,
                tool_input: newInput,
              })
            }
          } else {
            // 새로운 tool_use 메시지 생성
            const toolMessageId = addMessage({
              type: 'tool_use',
              tool_name: toolName,
              tool_input: toolInput,
              isUser: false,
            })
            console.log('Created new tool_use message:', { toolMessageId, toolName, toolInput })
            currentMessageId = toolMessageId
            lastMessageType = 'tool_use'
          }
        },
        // onReasoning: 추론 과정 처리
        (reasoning: string) => {
          if (lastMessageType === 'reasoning') {
            // 이전 메시지가 reasoning 타입이면 기존 메시지에 추가
            const currentMessage = messages.find(msg => msg.id === currentMessageId)
            if (currentMessage) {
              updateMessage(currentMessageId, {
                reasoning_text: (currentMessage.reasoning_text || '') + reasoning,
              })
            }
          } else {
            // 새로운 reasoning 메시지 생성
            const reasoningMessageId = addMessage({
              type: 'reasoning',
              reasoning_text: reasoning,
              isUser: false,
            })
            currentMessageId = reasoningMessageId
            lastMessageType = 'reasoning'
          }
        },
        // onComplete: 최종 응답 처리
        (finalResponse: string) => {
          updateMessage(currentMessageId, {
            type: 'complete',
            data: finalResponse,
            isComplete: true,
          })
          lastMessageType = 'complete'
          // AI 응답 완료
          setAiResponseStatus({
            isWaiting: false,
            isProcessing: false,
          })
        },
        // onError: 에러 처리
        (error: string) => {
          updateMessage(currentMessageId, {
            type: 'error',
            error: `오류가 발생했습니다: ${error}`,
          })
          // AI 응답 에러
          setAiResponseStatus({
            isWaiting: false,
            isProcessing: false,
          })
        }
      )

    } catch (error) {
      console.error('AgentCore 호출 오류:', error)
      setAiResponseStatus({
        isWaiting: false,
        isProcessing: false,
      })
      addMessage({
        type: 'error',
        error: `AgentCore 호출 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : '알 수 없는 오류'
        }`,
        isUser: false,
      })
    }
  }

  const handleButtonClick = async (command: string) => {
    // JSON에서 버튼 정보 찾기
    const buttonInfo = robotControlMapping.robotControlButtons.find(btn => btn.text === command)
    
    if (buttonInfo) {
      // 사용자 메시지를 채팅창에 먼저 추가
      addMessage({
        type: 'chunk',
        data: command,
        isUser: true,
      })
      
      // 로봇 제어 버튼은 Lambda 함수로 직접 제어
      try {
        setRobotControlStatus(prev => ({ 
          ...prev, 
          isExecuting: true, 
          error: null,
          lastAction: command 
        }))
        
        const response = await invokeRobotControl({ 
          action: buttonInfo.action as RobotAction,
          message: buttonInfo.message 
        })
        
        if (response.statusCode === 200 && response.body) {
          addMessage({
            type: 'chunk',
            data: buttonInfo.message || `로봇 제어 명령 "${command}"이 성공적으로 실행되었습니다.`,
            isUser: false,
          })
          setRobotControlStatus(prev => ({ 
            ...prev, 
            isExecuting: false,
            error: null 
          }))
        } else {
          throw new Error('로봇 제어 명령 실행에 실패했습니다.')
        }
      } catch (error) {
        console.error('로봇 제어 오류:', error)
        setRobotControlStatus(prev => ({ 
          ...prev, 
          isExecuting: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        }))
        
        addMessage({
          type: 'error',
          error: `로봇 제어 명령 실행 중 오류가 발생했습니다: ${
            error instanceof Error ? error.message : '알 수 없는 오류'
          }`,
          isUser: false,
        })
      }
    } else {
      // 빠른 명령, 긴급 신고 등은 기존 BedrockAgentCore 방식으로 처리
      handleSendMessage(command)
    }
  }

  const handleResetChat = () => {
    clearMessages()
    // useEffect에서 자동으로 초기 메시지가 추가되므로 여기서는 추가하지 않음
  }

  // 전체 비활성화 상태 계산
  const isDisabled = robotControlStatus.isExecuting || aiResponseStatus.isWaiting || aiResponseStatus.isProcessing

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
    <ResponsiveContainer>
      <MainLayout>
        {/* 왼쪽 패널 - 제어 버튼들 */}
        <SidePanel>
          
          {/* 로봇 제어 패널 */}
          <StyledCard sx={{ 
            flex: '0 0 auto',
            '&:hover': {
              transform: 'translateY(-4px)',
            }
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
                  로봇 제어
                </Typography>
                {robotControlStatus.isExecuting && (
                  <LinearProgress sx={{ width: 60, height: 4, borderRadius: 2 }} />
                )}
              </Box>
              {robotControlStatus.lastAction && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontSize: '0.75rem' }}>
                  마지막 실행: {robotControlStatus.lastAction}
                </Typography>
              )}
              {robotControlStatus.error && (
                <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block', fontSize: '0.75rem' }}>
                  오류: {robotControlStatus.error}
                </Typography>
              )}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: '1fr 1fr', 
                  md: '1fr 1fr',
                  lg: '1fr 1fr 1fr',
                  xl: '1fr 1fr 1fr'
                }, 
                gap: { xs: 1, sm: 1.5, md: 2 },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {robotControlMapping.robotControlButtons.map((button, index) => (
                  <StyledButton
                    key={index}
                    variant="contained"
                    color={button.color as any}
                    fullWidth
                    startIcon={getIconComponent(button.icon)}
                    disabled={isDisabled}
                    onClick={() => handleButtonClick(button.text)}
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' }, 
                      py: { xs: 1, sm: 1.5, md: 1.5 },
                      minHeight: { xs: '40px', sm: '44px', md: '48px' }
                    }}
                  >
                    {button.text}
                  </StyledButton>
                ))}
              </Box>
            </CardContent>
          </StyledCard>

          {/* 채팅 패널 */}
          <StyledCard sx={{ 
            flex: '0 0 auto',
            '&:hover': {
              transform: 'translateY(-4px)',
            }
          }}>
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
                    disabled={isDisabled}
                    onClick={() => handleButtonClick(item.text)}
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' }, 
                      textAlign: 'left', 
                      py: { xs: 1, sm: 1.5, md: 1.5 },
                      minHeight: { xs: '40px', sm: '44px', md: '48px' }
                    }}
                  >
                    {item.text}
                  </StyledButton>
                ))}
              </Box>
            </CardContent>
          </StyledCard>
        </SidePanel>

        {/* 중앙 패널 - 채팅 인터페이스 */}
        <ChatPanel>
          <ChatInterface
            messages={messages}
            inputText={inputText}
            setInputText={setInputText}
            onSendMessage={handleSendMessage}
            onResetChat={handleResetChat}
            agentCoreStatus={agentCoreStatus}
            isDisabled={isDisabled}
          />
        </ChatPanel>

        {/* 오른쪽 패널 - 작업 상태 */}
        <SidePanel>
          <StyledCard sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: 0,
            '&:hover': {
              transform: 'translateY(-4px)',
            }
          }}>
            <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
                작업 현황
              </Typography>
              <List sx={{ p: 0, flex: 1, overflow: 'auto' }}>
                {tasks.map((task, index) => (
                  <React.Fragment key={task.id}>
                    <ListItem sx={{ 
                      px: 0, 
                      py: 1.5, 
                      flexDirection: 'column', 
                      alignItems: 'stretch',
                      borderRadius: 2,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        transform: 'translateX(4px)',
                      }
                    }}>
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
        </SidePanel>
      </MainLayout>
    </ResponsiveContainer>
  )
}
