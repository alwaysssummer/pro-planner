import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { fetchGoogleSheetData, validateGoogleSheetUrl } from '../utils/googleSheets';
import { taskService, studentService, assignmentService } from '../services/database';

interface Task {
  id: string;
  title: string;
  description: string;
  area: 'vocabulary' | 'phrase' | 'grammar' | 'logic';
  status: 'active' | 'completed' | 'pending';
  google_sheet_url?: string;
  created_at?: string;
}

interface Student {
  id: string;
  name: string;
  level: string;
}

const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [openWorkDialog, setOpenWorkDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [workingTask, setWorkingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    area: 'vocabulary' as 'vocabulary' | 'phrase' | 'grammar' | 'logic',
  });
  const [workData, setWorkData] = useState({
    googleSheetLink: '',
    previewData: [] as Array<{ unit: string; english: string; meaning: string }>,
    isLoading: false,
    isSaving: false,
    error: '',
  });

  // 과제와 학생 목록 불러오기
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, studentsData] = await Promise.all([
        taskService.getAll(),
        studentService.getAll()
      ]);
      setTasks(tasksData);
      setStudents(studentsData);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (task?: Task, area?: 'vocabulary' | 'phrase' | 'grammar' | 'logic') => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        area: task.area,
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        area: area || 'vocabulary',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      area: 'vocabulary',
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingTask) {
        // 과제 수정
        const updatedTask = await taskService.update(editingTask.id, formData);
        setTasks(tasks.map(task => task.id === editingTask.id ? updatedTask : task));
        setSuccessMessage('과제가 수정되었습니다.');
      } else {
        // 새 과제 추가
        const newTask = await taskService.create(formData);
        setTasks([...tasks, newTask]);
        setSuccessMessage('과제가 추가되었습니다.');
      }
      handleCloseDialog();
    } catch (err) {
      setError('과제 저장에 실패했습니다.');
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('정말로 이 과제를 삭제하시겠습니까?')) {
      try {
        await taskService.delete(taskId);
        setTasks(tasks.filter(task => task.id !== taskId));
        setSuccessMessage('과제가 삭제되었습니다.');
      } catch (err) {
        setError('과제 삭제에 실패했습니다.');
        console.error(err);
      }
    }
  };

  const handleWorkTask = async (task: Task) => {
    setWorkingTask(task);
    setWorkData({
      googleSheetLink: task.google_sheet_url || '',
      previewData: [],
      isLoading: false,
      isSaving: false,
      error: '',
    });
    
    // 기존 단어 데이터 불러오기
    if (task.area === 'vocabulary') {
      try {
        const vocabularyItems = await taskService.getVocabularyItems(task.id);
        setWorkData(prev => ({
          ...prev,
          previewData: vocabularyItems.map(item => ({
            unit: item.unit,
            english: item.english,
            meaning: item.meaning
          }))
        }));
      } catch (err) {
        console.error('단어 데이터 불러오기 실패:', err);
      }
    }
    
    setOpenWorkDialog(true);
  };

  const handleCloseWorkDialog = () => {
    setOpenWorkDialog(false);
    setWorkingTask(null);
    setWorkData({
      googleSheetLink: '',
      previewData: [],
      isLoading: false,
      isSaving: false,
      error: '',
    });
  };

  const handlePreviewSheet = async () => {
    if (!workData.googleSheetLink) {
      setWorkData({ ...workData, error: '구글 시트 링크를 입력해주세요.' });
      return;
    }

    if (!validateGoogleSheetUrl(workData.googleSheetLink)) {
      setWorkData({ ...workData, error: '올바른 구글 시트 링크가 아닙니다.' });
      return;
    }

    setWorkData({ ...workData, isLoading: true, error: '' });

    try {
      const data = await fetchGoogleSheetData(workData.googleSheetLink);
      setWorkData({
        ...workData,
        previewData: data,
        isLoading: false,
        error: '',
      });
    } catch (error) {
      setWorkData({
        ...workData,
        isLoading: false,
        error: '데이터를 불러오는데 실패했습니다. 구글 시트가 공개되어 있는지 확인해주세요.',
      });
    }
  };

  const handleSaveWork = async () => {
    if (!workingTask) return;

    try {
      setWorkData({ ...workData, isSaving: true, error: '' });
      
      // 구글 시트 URL 업데이트
      if (workData.googleSheetLink !== workingTask.google_sheet_url) {
        await taskService.update(workingTask.id, {
          google_sheet_url: workData.googleSheetLink
        });
      }

      // 단어 데이터 저장
      if (workingTask.area === 'vocabulary' && workData.previewData.length > 0) {
        // 대량 데이터 저장 시 사용자에게 알림
        if (workData.previewData.length > 1000) {
          setSuccessMessage(`${workData.previewData.length}개의 단어를 저장 중입니다. 잠시만 기다려주세요...`);
        }
        
        await taskService.addVocabularyItems(workingTask.id, workData.previewData);
      }

      setSuccessMessage(`작업이 저장되었습니다. (총 ${workData.previewData.length}개 단어)`);
      handleCloseWorkDialog();
      loadData(); // 데이터 새로고침
    } catch (err) {
      setError('작업 저장에 실패했습니다.');
      console.error(err);
    } finally {
      setWorkData({ ...workData, isSaving: false });
    }
  };

  const getAreaText = (area: string) => {
    switch (area) {
      case 'vocabulary': return '단어';
      case 'phrase': return '문장';
      case 'grammar': return '어법';
      case 'logic': return '논리';
      default: return area;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '진행중';
      case 'completed': return '완료';
      case 'pending': return '대기중';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'primary';
      case 'completed': return 'success';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        과제 관리
      </Typography>

      {/* 영역별 과제 추가 버튼 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog(undefined, 'vocabulary')}
        >
          단어 과제 추가
        </Button>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog(undefined, 'phrase')}
        >
          문장 과제 추가
        </Button>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog(undefined, 'grammar')}
        >
          어법 과제 추가
        </Button>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog(undefined, 'logic')}
        >
          논리 과제 추가
        </Button>
      </Box>

      {/* 과제 목록 테이블 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>과제명</TableCell>
              <TableCell>설명</TableCell>
              <TableCell>영역</TableCell>
              <TableCell>상태</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.title}</TableCell>
                <TableCell>{task.description}</TableCell>
                <TableCell>
                  <Chip label={getAreaText(task.area)} size="small" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusText(task.status)} 
                    size="small" 
                    color={getStatusColor(task.status) as any}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    onClick={() => handleWorkTask(task)}
                    color="primary"
                  >
                    <WorkIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleOpenDialog(task)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteTask(task.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 과제 추가/수정 다이얼로그 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTask ? '과제 수정' : '새 과제 추가'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="과제명"
            fullWidth
            variant="outlined"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="설명"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>영역</InputLabel>
            <Select
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value as any })}
              label="영역"
            >
              <MenuItem value="vocabulary">단어</MenuItem>
              <MenuItem value="phrase">문장</MenuItem>
              <MenuItem value="grammar">어법</MenuItem>
              <MenuItem value="logic">논리</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTask ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 작업 다이얼로그 */}
      <Dialog open={openWorkDialog} onClose={handleCloseWorkDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {workingTask?.title} - 작업
        </DialogTitle>
        <DialogContent>
          {workingTask?.area === 'vocabulary' && (
            <>
              <TextField
                margin="dense"
                label="구글 시트 링크"
                fullWidth
                variant="outlined"
                value={workData.googleSheetLink}
                onChange={(e) => setWorkData({ ...workData, googleSheetLink: e.target.value })}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                sx={{ mb: 2 }}
              />
              <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={handlePreviewSheet}
                  disabled={workData.isLoading}
                >
                  {workData.isLoading ? '불러오는 중...' : '미리보기'}
                </Button>
              </Box>
              
              {workData.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {workData.error}
                </Alert>
              )}

              {workData.previewData.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    단어 데이터 미리보기 ({workData.previewData.length}개)
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>단원</TableCell>
                          <TableCell>영어</TableCell>
                          <TableCell>뜻</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {workData.previewData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>{item.english}</TableCell>
                            <TableCell>{item.meaning}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          )}
          
          {workingTask?.area !== 'vocabulary' && (
            <Alert severity="info">
              {getAreaText(workingTask?.area || '')} 영역의 작업 기능은 준비 중입니다.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWorkDialog} disabled={workData.isSaving}>취소</Button>
          <Button 
            onClick={handleSaveWork} 
            variant="contained"
            disabled={workData.isSaving || (workingTask?.area === 'vocabulary' && workData.previewData.length === 0)}
          >
            {workData.isSaving ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 성공 메시지 */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      {/* 에러 메시지 */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskManagement; 