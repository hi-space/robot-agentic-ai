import React, { useState, useRef, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography, Paper } from '@mui/material';
import ChatInterface from './components/ChatInterface';
import { Message } from './types/Message';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentAIMessage, setCurrentAIMessage] = useState<Message | null>(null);
  const apiService = useRef(new ApiService());
  const sseService = useRef(new SSEService());

  useEffect(() => {
    // Initialize SSE connection
    const initSSE = async () => {
      try {
        await sseService.current.connect();
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect to SSE:', error);
        setIsConnected(false);
      }
    };

    initSSE();

    // Set up SSE message handlers
    sseService.current.onMessage((sseMessage: SSEMessage) => {
      handleSSEMessage(sseMessage);
    });

    sseService.current.onError((error: string) => {
      setIsConnected(false);
    });

    sseService.current.onConnect(() => {
      setIsConnected(true);
    });

    sseService.current.onDisconnect((reason: string) => {
      setIsConnected(false);
    });

    return () => {
      sseService.current.disconnect();
    };
  }, []);

  const handleSSEMessage = (sseMessage: SSEMessage) => {
    switch (sseMessage.type) {
      case 'message':
        if (sseMessage.sender === 'ai') {
          const aiMessage: Message = {
            id: sseMessage.messageId || Date.now().toString(),
            content: sseMessage.content || '',
            sender: 'ai',
            timestamp: new Date(sseMessage.timestamp || Date.now()),
            isError: sseMessage.isError,
          };
          setMessages(prev => [...prev, aiMessage]);
          setCurrentAIMessage(null);
          setIsLoading(false);
        }
        break;
      case 'partial':
        if (sseMessage.sender === 'ai') {
          const partialMessage: Message = {
            id: sseMessage.messageId || Date.now().toString(),
            content: sseMessage.content || '',
            sender: 'ai',
            timestamp: new Date(sseMessage.timestamp || Date.now()),
            isTyping: true,
          };
          setCurrentAIMessage(partialMessage);
        }
        break;
      case 'typing':
        setIsLoading(sseMessage.content === 'true');
        break;
      case 'error':
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: sseMessage.content || '오류가 발생했습니다.',
          sender: 'ai',
          timestamp: new Date(),
          isError: true,
        };
        setMessages(prev => [...prev, errorMessage]);
        setCurrentAIMessage(null);
        setIsLoading(false);
        break;
      case 'complete':
        setIsLoading(false);
        setCurrentAIMessage(null);
        break;
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
    setCurrentAIMessage(null);

    try {
      if (isConnected) {
        // Use SSE for real-time streaming
        await sseService.current.sendMessage(content);
      } else {
        // Fallback to regular API
        const response = await apiService.current.sendMessage(content);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.content,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }
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
    setCurrentAIMessage(null);
    setIsLoading(false);
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
        <Container maxWidth="md">
          <Paper
            elevation={24}
            sx={{
              height: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 3,
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
                🤖 AI Agent Assistant
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
                    bgcolor: isConnected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    border: 1,
                    borderColor: isConnected ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: isConnected ? '#4caf50' : '#f44336',
                      animation: isConnected ? 'pulse 2s infinite' : 'none',
                      '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                        '100%': { opacity: 1 },
                      },
                    }}
                  />
                  <Typography variant="caption">
                    {isConnected ? '실시간 연결됨' : '연결 끊어짐'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onResetChat={handleResetChat}
              isLoading={isLoading}
              currentAIMessage={currentAIMessage}
            />
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;