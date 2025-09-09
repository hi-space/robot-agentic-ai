import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Chip,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  FlashOn as FlashOnIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'

const features = [
  {
    name: '빠른 개발',
    description: 'Vite와 React 19를 사용한 최신 개발 환경',
    icon: FlashOnIcon,
    color: 'primary' as const,
  },
  {
    name: '안전한 인증',
    description: 'AWS Amplify를 통한 안전한 사용자 인증',
    icon: SecurityIcon,
    color: 'success' as const,
  },
  {
    name: '확장 가능',
    description: 'TypeScript와 모듈화된 구조로 확장 가능한 아키텍처',
    icon: GroupIcon,
    color: 'secondary' as const,
  },
]

export default function Home() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Hero section */}
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            lineHeight: 1.2,
          }}
        >
          Amplify Frontend에 오신 것을 환영합니다
        </Typography>
        <Typography
          variant="h6"
          sx={{
            mb: 4,
            opacity: 0.9,
            maxWidth: '600px',
            mx: 'auto',
          }}
        >
          React 19, TypeScript, AWS Amplify를 사용한 현대적인 웹 애플리케이션입니다.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            component={Link}
            to="/dashboard"
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'grey.100',
              },
            }}
          >
            대시보드로 이동
          </Button>
          <Button
            component={Link}
            to="/profile"
            variant="outlined"
            size="large"
            sx={{
              borderColor: 'white',
              color: 'white',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            프로필 보기
          </Button>
        </Box>
      </Paper>

      {/* Features section */}
      <Box sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Chip
            label="주요 기능"
            color="primary"
            sx={{ mb: 2 }}
          />
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            현대적인 웹 개발을 위한 모든 것
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: '600px', mx: 'auto' }}
          >
            최신 기술 스택을 사용하여 빠르고 안전하며 확장 가능한 웹 애플리케이션을 구축하세요.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(3, 1fr)',
            },
            gap: 4,
          }}
        >
          {features.map((feature) => (
            <Card
              key={feature.name}
              elevation={2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: `${feature.color}.light`,
                      color: `${feature.color}.contrastText`,
                      mr: 2,
                    }}
                  >
                    <feature.icon />
                  </Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{ fontWeight: 600 }}
                  >
                    {feature.name}
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Status section */}
      <Card elevation={1}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              애플리케이션이 정상적으로 실행 중입니다
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
