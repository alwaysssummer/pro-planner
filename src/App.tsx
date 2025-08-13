import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
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
  useEffect(() => {
    // 앱 시작 시 Supabase 연결 상태 확인
    console.log('🚀 앱 시작 - Supabase 연결 확인 중...');
    checkEnvironmentVariables();
    testConnection();
  }, []);

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