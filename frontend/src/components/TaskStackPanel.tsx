import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Fade,
  Collapse,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SmartToy as BotIcon,
  Build as BuildIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { Task } from '../types/Message';

interface TaskStackPanelProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const TaskStackPanel: React.FC<TaskStackPanelProps> = ({ tasks, onTaskClick }) => {
  const [expandedTasks, setExpandedTasks] = React.useState<Set<string>>(new Set());

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return <ScheduleIcon color="warning" />;
      case 'in_progress':
        return <PlayIcon color="primary" />;
      case 'completed':
        return <CheckIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <ScheduleIcon color="warning" />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type: Task['type']) => {
    switch (type) {
      case 'command':
        return <BotIcon color="primary" />;
      case 'action':
        return <BuildIcon color="secondary" />;
      case 'response':
        return <ReplyIcon color="info" />;
      default:
        return <BotIcon color="primary" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(timestamp);
  };

  const sortedTasks = [...tasks].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Tasks List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {tasks.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              color: 'text.secondary',
              p: 3,
            }}
          >
            <BuildIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
            <Typography variant="body2">
              아직 작업이 없습니다
            </Typography>
            <Typography variant="caption" sx={{ mt: 1 }}>
              AI가 명령을 처리하면 여기에 표시됩니다
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {sortedTasks.map((task, index) => {
              const isExpanded = expandedTasks.has(task.id);
              const isLast = index === sortedTasks.length - 1;

              return (
                <React.Fragment key={task.id}>
                  <ListItem
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      flexDirection: 'column',
                      alignItems: 'stretch',
                    }}
                    onClick={() => onTaskClick?.(task)}
                  >
                    {/* Task Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                      }}
                    >
                      {getTypeIcon(task.type)}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {task.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          {formatTime(task.timestamp)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                          label={task.status}
                          size="small"
                          color={getStatusColor(task.status) as any}
                          icon={getStatusIcon(task.status)}
                          sx={{ fontSize: '0.7rem' }}
                        />
                        {task.description && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskExpansion(task.id);
                            }}
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    {/* Progress Bar */}
                    {task.status === 'in_progress' && task.progress !== undefined && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={task.progress}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 2,
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          {task.progress}% 완료
                        </Typography>
                      </Box>
                    )}

                    {/* Task Description */}
                    {task.description && (
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: 1, pl: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            {task.description}
                          </Typography>
                          {task.metadata && Object.keys(task.metadata).length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                메타데이터: {JSON.stringify(task.metadata, null, 2)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    )}
                  </ListItem>
                  {!isLast && <Divider sx={{ mx: 2 }} />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default TaskStackPanel;
