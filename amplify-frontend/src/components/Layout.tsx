import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'

interface LayoutProps {
  children: ReactNode
  user: any
  signOut: () => void
}

const StyledTabs = styled(Tabs)(() => ({
  '& .MuiTab-root': {
    minHeight: 64,
    textTransform: 'none',
    fontWeight: 500,
  },
}))

const navigation = [
  { name: '홈', href: '/', icon: HomeIcon },
  { name: '대시보드', href: '/dashboard', icon: DashboardIcon },
  { name: '프로필', href: '/profile', icon: PersonIcon },
]

export default function Layout({ children, user, signOut }: LayoutProps) {
  const location = useLocation()

  const getCurrentTabIndex = () => {
    const currentPath = location.pathname
    const tabIndex = navigation.findIndex(item => item.href === currentPath)
    return tabIndex >= 0 ? tabIndex : 0
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 0, 
              mr: 4, 
              fontWeight: 'bold',
              color: 'primary.main'
            }}
          >
            Amplify Frontend
          </Typography>
          
          <Box sx={{ flexGrow: 1 }}>
            <StyledTabs
              value={getCurrentTabIndex()}
              indicatorColor="primary"
              textColor="primary"
            >
              {navigation.map((item) => (
                <Tab
                  key={item.name}
                  label={item.name}
                  icon={<item.icon />}
                  iconPosition="start"
                  component={Link}
                  to={item.href}
                  sx={{ minHeight: 64 }}
                />
              ))}
            </StyledTabs>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              안녕하세요, {user?.username}님
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<LogoutIcon />}
              onClick={signOut}
              size="small"
            >
              로그아웃
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Container maxWidth="xl" sx={{ py: 3, flexGrow: 1 }}>
        {children}
      </Container>
    </Box>
  )
}
