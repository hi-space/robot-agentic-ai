import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
} from '@mui/material'
import {
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Monitor as MonitorIcon,
} from '@mui/icons-material'

const stats = [
  { name: '총 사용자', value: '2,345', change: '+12%', changeType: 'positive' as const },
  { name: '활성 세션', value: '1,234', change: '+8%', changeType: 'positive' as const },
  { name: '전환율', value: '3.2%', change: '-2%', changeType: 'negative' as const },
  { name: '평균 응답 시간', value: '245ms', change: '+5%', changeType: 'negative' as const },
]

const recentActivity = [
  { id: 1, user: '김철수', action: '새 계정 생성', time: '2분 전' },
  { id: 2, user: '이영희', action: '프로필 업데이트', time: '5분 전' },
  { id: 3, user: '박민수', action: '로그인', time: '10분 전' },
  { id: 4, user: '정수진', action: '설정 변경', time: '15분 전' },
]

export default function Dashboard() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          대시보드
        </Typography>
        <Typography variant="body1" color="text.secondary">
          애플리케이션의 주요 지표와 활동을 확인하세요.
        </Typography>
      </Box>

      {/* Stats grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 3,
        }}
      >
        {stats.map((stat) => (
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ flexShrink: 0, mr: 2 }}>
                    <BarChartIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {stat.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 0.5 }}>
                      <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                        {stat.value}
                      </Typography>
                      <Chip
                        label={stat.change}
                        size="small"
                        color={stat.changeType === 'positive' ? 'success' : 'error'}
                        sx={{ ml: 1, fontSize: '0.75rem' }}
                      />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
        ))}
      </Box>

      {/* Charts section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'repeat(2, 1fr)',
          },
          gap: 3,
        }}
      >
        <Box>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                  사용자 트렌드
                </Typography>
                <TrendingUpIcon sx={{ color: 'text.secondary' }} />
              </Box>
              <Box
                sx={{
                  height: 256,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography color="text.secondary">차트 영역 (실제 구현 필요)</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                  시스템 상태
                </Typography>
                <MonitorIcon sx={{ color: 'text.secondary' }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      CPU 사용률
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      45%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={45}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      메모리 사용률
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      67%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={67}
                    color="secondary"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Recent activity */}
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              최근 활동
            </Typography>
            <PeopleIcon sx={{ color: 'text.secondary' }} />
          </Box>
          <List>
            {recentActivity.map((activity, index) => (
              <ListItem
                key={activity.id}
                sx={{
                  px: 0,
                  py: 2,
                  borderBottom: index < recentActivity.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    {activity.user.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      <Typography component="span" sx={{ fontWeight: 500 }}>
                        {activity.user}
                      </Typography>
                      님이{' '}
                      <Typography component="span" sx={{ fontWeight: 500 }}>
                        {activity.action}
                      </Typography>
                      을(를) 수행했습니다.
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {activity.time}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  )
}
