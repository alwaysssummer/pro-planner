import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import TaskManagement from './pages/TaskManagement';
import StudentManagement from './pages/StudentManagement';
import StudentPage from './pages/StudentPage';
import { testConnection, checkEnvironmentVariables } from './utils/supabase';
import './utils/migrateToSupabase'; // 마이그레이션 도구 로드

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // 앱 시작 시 Supabase 연결 상태 확인
    console.log('🚀 앱 시작 - Supabase 연결 확인 중...');
    
    const initializeApp = async () => {
      try {
        // 환경 변수 확인
        const envCheck = checkEnvironmentVariables();
        if (!envCheck) {
          setConnectionError('환경 변수가 설정되지 않았습니다.');
          setIsLoading(false);
          return;
        }

        // Supabase 연결 테스트
        const connectionTest = await testConnection();
        if (!connectionTest) {
          setConnectionError('Supabase 연결에 실패했습니다.');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('앱 초기화 오류:', error);
        setConnectionError('앱 초기화 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="100vh"
          gap={2}
        >
          <CircularProgress size={60} />
          <Typography variant="h6">Pro Planner 로딩 중...</Typography>
          <Typography variant="body2" color="text.secondary">Supabase 연결 확인 중</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (connectionError) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="100vh"
          gap={2}
          p={3}
        >
          <Alert severity="error" sx={{ maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>연결 오류</Typography>
            <Typography variant="body1">{connectionError}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              브라우저 개발자 도구의 콘솔을 확인하여 자세한 오류 정보를 확인하세요.
            </Typography>
          </Alert>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<AdminLayout><Outlet /></AdminLayout>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tasks" element={<TaskManagement />} />
            <Route path="students" element={<StudentManagement />} />
          </Route>
          <Route path="/student/:studentId" element={<StudentPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 