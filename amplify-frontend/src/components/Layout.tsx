import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  SmartToy as AgentIcon,
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'

interface LayoutProps {
  children: ReactNode
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
  { name: '에이전트', href: '/agent', icon: AgentIcon },
  { name: '대시보드', href: '/dashboard', icon: DashboardIcon },
]

export default function Layout({ children }: LayoutProps) {
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
          <Box
            component="img"
            src="/logo.png"
            alt="RoboGuard AgenticAI Logo"
            sx={{
              width: 40,
              height: 40,
              mr: 2,
              borderRadius: '8px',
              objectFit: 'cover'
            }}
          />
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
            RoboGuard AgenticAI
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

        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 0,
        maxWidth: '100%',
        width: '100%'
      }}>
        {children}
      </Box>
    </Box>
  )
}
