import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  List,
  ListItem,
  Typography,
  Chip,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  Send as SendIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { Message } from '../types/Message';
import MessageBubble from './MessageBubble';
import RecommendedCommands from './RecommendedCommands';
import VoiceRecorder from './VoiceRecorder';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onResetChat: () => void;
  isLoading: boolean;
  currentAIMessage?: Message | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onResetChat,
  isLoading,
  currentAIMessage,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleVoiceResult = (transcript: string) => {
    if (transcript.trim()) {
      onSendMessage(transcript.trim());
    }
  };

  const handleReset = () => {
    setInputValue('');
    onResetChat();
    inputRef.current?.focus();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <BotIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" gutterBottom>
              안녕하세요! AI 어시스턴트입니다
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              텍스트를 입력하거나 음성으로 명령을 말씀해주세요
            </Typography>
            <RecommendedCommands onCommandSelect={onSendMessage} />
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map((message) => (
              <ListItem key={message.id} sx={{ px: 0, py: 0.5 }}>
                <MessageBubble message={message} />
              </ListItem>
            ))}
            {currentAIMessage && (
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <MessageBubble message={currentAIMessage} />
              </ListItem>
            )}
            {isLoading && !currentAIMessage && (
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 2,
                    bgcolor: 'grey.100',
                    borderRadius: 2,
                    ml: 6,
                  }}
                >
                  <BotIcon color="primary" />
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    AI가 응답을 생성하고 있습니다...
                  </Typography>
                </Box>
              </ListItem>
            )}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Input Area */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          borderRadius: 0,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="메시지를 입력하세요..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
          />
          <VoiceRecorder
            onRecordingChange={setIsRecording}
            onResult={handleVoiceResult}
            disabled={isLoading}
          />
          <IconButton
            color="secondary"
            onClick={handleReset}
            disabled={isLoading}
            sx={{
              bgcolor: 'grey.500',
              color: 'white',
              width: 48,
              height: 48,
              '&:hover': {
                bgcolor: 'grey.600',
              },
              '&:disabled': {
                bgcolor: 'grey.300',
                color: 'grey.500',
              },
            }}
            title="새로운 채팅 시작"
          >
            <ClearIcon />
          </IconButton>
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              width: 48,
              height: 48,
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&:disabled': {
                bgcolor: 'grey.300',
                color: 'grey.500',
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatInterface;
