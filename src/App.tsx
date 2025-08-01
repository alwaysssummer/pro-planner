import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AdminLayout from './components/AdminLayout';
import TaskManagement from './pages/TaskManagement';
import StudentManagement from './pages/StudentManagement';
import StudentPage from './pages/StudentPage';
// import { testConnection } from './utils/supabase';

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
  // useEffect(() => {
  //   // Supabase 연결 테스트
  //   testConnection();
  // }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<AdminLayout><Outlet /></AdminLayout>}>
            <Route index element={<TaskManagement />} />
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