import React, { useState, useRef, useEffect } from 'react';
import {
  IconButton,
  Tooltip,
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Stop as StopIcon,
} from '@mui/icons-material';

interface VoiceRecorderProps {
  onRecordingChange: (isRecording: boolean) => void;
  onResult: (transcript: string) => void;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingChange,
  onResult,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingChange(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecordingChange(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Here you would typically send the audio to a speech-to-text service
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate transcription result
      const mockTranscript = "음성 인식 결과: " + new Date().toLocaleTimeString();
      onResult(mockTranscript);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      onResult('음성 인식 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isProcessing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="caption" color="text.secondary">
          처리 중...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {isRecording && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="error.main" fontWeight="bold">
            {formatTime(recordingTime)}
          </Typography>
          <LinearProgress
            sx={{
              width: 60,
              height: 4,
              borderRadius: 2,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'error.main',
              },
            }}
          />
        </Box>
      )}
      
      <Tooltip title={isRecording ? "녹음 중지" : "음성 녹음"}>
        <IconButton
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          sx={{
            bgcolor: isRecording ? 'error.main' : 'primary.main',
            color: 'white',
            width: 48,
            height: 48,
            '&:hover': {
              bgcolor: isRecording ? 'error.dark' : 'primary.dark',
            },
            '&:disabled': {
              bgcolor: 'grey.300',
              color: 'grey.500',
            },
          }}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default VoiceRecorder;

