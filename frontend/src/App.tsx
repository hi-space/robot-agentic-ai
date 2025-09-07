import React, { useState, useRef, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography, Paper } from '@mui/material';
import ChatInterface from './components/ChatInterface';
import TaskStackPanel from './components/TaskStackPanel';
import { Message, Task } from './types/Message';
import { ApiService } from './services/ApiService';
import { SSEService, SSEMessage } from './services/SSEService';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
});

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task-1',
      title: '로봇 이동 명령',
      description: '로봇을 (10, 20) 좌표로 이동합니다. 현재 진행률 75%',
      status: 'in_progress',
      type: 'action',
      timestamp: new Date(Date.now() - 30000),
      progress: 75,
      metadata: {
        coordinates: [10, 20],
        speed: 'normal',
        estimatedTime: '2분'
      }
    },
    {
      id: 'task-2',
      title: 'AI 명령 분석',
      description: '사용자 명령을 분석하고 실행 계획을 수립합니다.',
      status: 'completed',
      type: 'command',
      timestamp: new Date(Date.now() - 60000),
      progress: 100,
      metadata: {
        command: 'move to coordinates',
        confidence: 0.95
      }
    },
    {
      id: 'task-3',
      title: '센서 데이터 수집',
      description: '주변 환경의 센서 데이터를 수집하고 분석합니다.',
      status: 'pending',
      type: 'action',
      timestamp: new Date(Date.now() - 120000),
      metadata: {
        sensors: ['camera', 'lidar', 'ultrasonic'],
        duration: '30초'
      }
    },
    {
      id: 'task-4',
      title: '장애물 회피',
      description: '경로상의 장애물을 감지하고 회피 경로를 계산합니다.',
      status: 'failed',
      type: 'action',
      timestamp: new Date(Date.now() - 180000),
      metadata: {
        obstacleType: 'unknown',
        retryCount: 3
      }
    },
    {
      id: 'task-5',
      title: '사용자 응답 생성',
      description: '작업 완료에 대한 사용자에게 응답 메시지를 생성합니다.',
      status: 'completed',
      type: 'response',
      timestamp: new Date(Date.now() - 240000),
      progress: 100,
      metadata: {
        responseType: 'success',
        messageLength: 45
      }
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const apiService = useRef(new ApiService());
  const sseService = useRef(new SSEService());

  useEffect(() => {
    // Set up SSE message handler for streaming
    sseService.current.setMessageHandler((sseMessage: any) => {
      handleSSEMessage(sseMessage);
    });

    sseService.current.onError((error: string) => {
      console.error('SSE Error:', error);
    });

    return () => {
      sseService.current.disconnect();
    };
  }, []);

  const handleSSEMessage = (sseMessage: any) => {
    console.log('Received SSE message:', sseMessage);
    
    // Handle streaming response from backend
    if (sseMessage.content !== undefined) {
      if (sseMessage.done) {
        console.log('Final message received');
        // Final message - mark the last typing message as complete
        setMessages(prev => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          
          if (lastMessage && lastMessage.sender === 'ai' && lastMessage.isTyping) {
            // Update the last typing message to final message
            updated[updated.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + (sseMessage.content || ''),
              isTyping: false,
            };
          } else if (sseMessage.content) {
            // Add new message if there's content and no typing message
            const aiMessage: Message = {
              id: Date.now().toString(),
              content: sseMessage.content,
              sender: 'ai',
              timestamp: new Date(),
              isError: sseMessage.is_error || false,
            };
            updated.push(aiMessage);
          }
          
          return updated;
        });
        setIsLoading(false);
      } else {
        console.log('Partial message received:', sseMessage.content);
        // Partial message - update or add typing message
        setMessages(prevMessages => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          
          if (lastMessage && lastMessage.sender === 'ai' && lastMessage.isTyping) {
            // Update existing typing message
            const updated = [...prevMessages];
            updated[updated.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + (sseMessage.content || ''),
            };
            return updated;
          } else {
            // Add new typing message
            const messageId = Date.now().toString();
            return [...prevMessages, {
              id: messageId,
              content: sseMessage.content || '',
              sender: 'ai' as const,
              timestamp: new Date(),
              isTyping: true,
            }];
          }
        });
      }
    } else if (sseMessage.is_error) {
      console.log('Error message received:', sseMessage);
      // Error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: sseMessage.content || '오류가 발생했습니다.',
        sender: 'ai',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Always use streaming for real-time response
      await sseService.current.sendMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다.',
        sender: 'ai',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setTasks([]);
    setIsLoading(false);
  };

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task);
    // You can add additional task click handling here
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', gap: 3, height: '80vh' }}>
            {/* Chat Interface Panel */}
            <Paper
              elevation={24}
              sx={{
                flex: 2,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 3,
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  p: 3,
                  borderBottom: 1,
                  borderColor: 'divider',
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  color: 'white',
                }}
              >
                <Typography variant="h4" component="h1" align="center" fontWeight="bold">
                  💬 AI 채팅
                </Typography>
                <Typography variant="subtitle1" align="center" sx={{ mt: 1, opacity: 0.9 }}>
                  텍스트 또는 음성으로 명령을 입력하세요
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: 'rgba(76, 175, 80, 0.2)',
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'rgba(76, 175, 80, 0.5)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#4caf50',
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { opacity: 1 },
                          '50%': { opacity: 0.5 },
                          '100%': { opacity: 1 },
                        },
                      }}
                    />
                    <Typography variant="caption">
                      스트리밍 활성화
                    </Typography>
                  </Box>
                </Box>
              </Box>
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onResetChat={handleResetChat}
          isLoading={isLoading}
        />
            </Paper>

            {/* Task Stack Panel */}
            <Paper
              elevation={24}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 3,
                minWidth: 350,
                maxWidth: 450,
              }}
            >
              <Box
                sx={{
                  p: 3,
                  borderBottom: 1,
                  borderColor: 'divider',
                  background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
                  color: 'white',
                }}
              >
                <Typography variant="h4" component="h1" align="center" fontWeight="bold">
                  📋 작업 스택
                </Typography>
                <Typography variant="subtitle1" align="center" sx={{ mt: 1, opacity: 0.9 }}>
                  AI 명령 처리 및 로봇 작업 현황
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Typography variant="caption">
                      {tasks.length}개 작업 진행 중
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <TaskStackPanel
                tasks={tasks}
                onTaskClick={handleTaskClick}
              />
            </Paper>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;