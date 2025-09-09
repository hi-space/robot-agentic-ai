import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material'
import {
  Person as PersonIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '김철수',
    email: 'kim@example.com',
    location: '서울, 대한민국',
    bio: 'React와 TypeScript를 사랑하는 개발자입니다. AWS Amplify를 사용하여 현대적인 웹 애플리케이션을 구축하고 있습니다.',
    joinDate: '2024년 1월 15일',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = () => {
    // 실제로는 API 호출을 통해 데이터를 저장
    console.log('프로필 저장:', formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // 폼 데이터를 원래 상태로 되돌리기
    setFormData({
      name: '김철수',
      email: 'kim@example.com',
      location: '서울, 대한민국',
      bio: 'React와 TypeScript를 사랑하는 개발자입니다. AWS Amplify를 사용하여 현대적인 웹 애플리케이션을 구축하고 있습니다.',
      joinDate: '2024년 1월 15일',
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            프로필
          </Typography>
          <Typography variant="body1" color="text.secondary">
            개인 정보를 확인하고 수정하세요.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
          onClick={() => setIsEditing(!isEditing)}
          color={isEditing ? 'secondary' : 'primary'}
        >
          {isEditing ? '취소' : '편집'}
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '1fr 2fr',
          },
          gap: 3,
        }}
      >
        {/* Profile info */}
        <Box>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Avatar
                sx={{
                  width: 96,
                  height: 96,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.light',
                  fontSize: '2rem',
                }}
              >
                <PersonIcon sx={{ fontSize: '3rem' }} />
              </Avatar>
              <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                {formData.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formData.email}
              </Typography>
              <Chip
                label={`${formData.joinDate} 가입`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Profile details */}
        <Box>
          <Card elevation={2}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                개인 정보
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="이름"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  fullWidth
                  variant="outlined"
                />

                <TextField
                  label="이메일"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                <TextField
                  label="위치"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                <TextField
                  label="자기소개"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                />

                {isEditing && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                    >
                      취소
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                    >
                      저장
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Account settings */}
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            계정 설정
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="비밀번호 변경"
                secondary="계정 보안을 위해 정기적으로 비밀번호를 변경하세요."
              />
              <ListItemSecondaryAction>
                <Button variant="outlined" startIcon={<LockIcon />}>
                  변경
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="2단계 인증"
                secondary="추가 보안을 위해 2단계 인증을 설정하세요."
              />
              <ListItemSecondaryAction>
                <Button variant="outlined" startIcon={<SecurityIcon />}>
                  설정
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="계정 삭제"
                secondary="계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다."
              />
              <ListItemSecondaryAction>
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteIcon />}
                >
                  삭제
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  )
}
