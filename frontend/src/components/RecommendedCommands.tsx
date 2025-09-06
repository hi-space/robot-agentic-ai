import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import { ApiService } from '../services/ApiService';

interface RecommendedCommandsProps {
  onCommandSelect: (command: string) => void;
}

const RecommendedCommands: React.FC<RecommendedCommandsProps> = ({
  onCommandSelect,
}) => {
  const [commands, setCommands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const apiService = new ApiService();

  useEffect(() => {
    const fetchCommands = async () => {
      try {
        const recommendedCommands = await apiService.getRecommendedCommands();
        setCommands(recommendedCommands);
      } catch (error) {
        console.error('Failed to fetch recommended commands:', error);
        // Fallback commands
        setCommands([
          '오늘 날씨는 어때?',
          '할 일 목록을 만들어줘',
          '이메일을 작성해줘',
          '일정을 확인해줘',
          '뉴스를 요약해줘',
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCommands();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          추천 명령어를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        추천 명령어:
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'center',
        }}
      >
        {commands.map((command, index) => (
          <Chip
            key={index}
            label={command}
            onClick={() => onCommandSelect(command)}
            variant="outlined"
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'white',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default RecommendedCommands;

