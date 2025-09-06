import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  SmartToy as BotIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Message } from '../types/Message';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isError = message.isError;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        width: '100%',
        mb: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          maxWidth: '80%',
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}
      >
        <Avatar
          sx={{
            bgcolor: isUser ? 'primary.main' : isError ? 'error.main' : 'secondary.main',
            width: 32,
            height: 32,
          }}
        >
          {isUser ? <PersonIcon /> : isError ? <ErrorIcon /> : <BotIcon />}
        </Avatar>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            bgcolor: isUser
              ? 'primary.main'
              : isError
              ? 'error.light'
              : 'grey.100',
            color: isUser ? 'white' : 'text.primary',
            borderRadius: 2,
            position: 'relative',
            '&::before': isUser
              ? {
                  content: '""',
                  position: 'absolute',
                  right: -8,
                  top: 12,
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid',
                  borderLeftColor: 'primary.main',
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                }
              : {
                  content: '""',
                  position: 'absolute',
                  left: -8,
                  top: 12,
                  width: 0,
                  height: 0,
                  borderRight: '8px solid',
                  borderRightColor: 'grey.100',
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                },
          }}
        >
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.5,
              opacity: message.isTyping ? 0.7 : 1,
            }}
          >
            {message.content}
            {message.isTyping && (
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: 8,
                  height: 16,
                  bgcolor: 'currentColor',
                  ml: 0.5,
                  animation: 'blink 1s infinite',
                  '@keyframes blink': {
                    '0%, 50%': { opacity: 1 },
                    '51%, 100%': { opacity: 0 },
                  },
                }}
              />
            )}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              opacity: 0.7,
              fontSize: '0.75rem',
            }}
          >
            {message.timestamp.toLocaleTimeString()}
          </Typography>
          {isError && (
            <Chip
              label="오류"
              size="small"
              color="error"
              sx={{ mt: 1, fontSize: '0.7rem' }}
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default MessageBubble;
