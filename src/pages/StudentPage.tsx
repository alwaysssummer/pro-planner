import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  AppBar,
  Toolbar,
  Container,
  Tabs,
  Tab,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Today as TodayIcon,
  ViewModule as ViewModuleIcon,
  PlayArrow as PlayArrowIcon,
  Settings as SettingsIcon,
  Timer as TimerIcon,
  DateRange as DateRangeIcon,
  CalendarMonth as CalendarMonthIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStudents, saveStudents, loadTasks } from '../utils/storage';
import { studentService, assignmentService } from '../services/database';
import { testConnection } from '../utils/supabase';
import VocabularyLearning from '../components/VocabularyLearning';
import VocabularyEvaluation from '../components/VocabularyEvaluation';

interface TaskAssignment {
  taskId: string;
  taskTitle: string;
  area: 'vocabulary' | 'phrase' | 'grammar' | 'logic';
  weeklySchedule: {
    [day: string]: {
      isActive: boolean;
      dailyAmount: string;
    };
  };
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'paused';
  progress: {
    completed: number;
    total: number;
  };
  startUnit?: string;
  vocabularyData?: Array<{ unit: string; english: string; meaning: string }>;
  targetDate?: string;
  targetUnit?: string;
  isWrongAnswerLearning?: boolean;
  wrongAnswerSession?: number;
}

interface Student {
  id: string;
  name: string;
  address: string;
  phone: string;
  grade: '초6' | '중1' | '중2' | '중3' | '고1' | '고2' | '고3';
  joinDate: string;
  status: 'active' | 'inactive';
  assignedTasks: string[];
  taskAssignments: TaskAssignment[];
  grades: {
    [year: string]: {
      mockExam3?: string;
      mockExam6?: string;
      mockExam9?: string;
      mockExam11?: string;
      midterm1?: string;
      final1?: string;
      midterm2?: string;
      final2?: string;
    };
  };
  learningHistory?: Array<{
    date: string;
    taskId: string;
    taskTitle: string;
    targetUnit?: string;
    learningSession: number;
    isFirstLearning: boolean;
    isWrongAnswerLearning?: boolean;
    wrongAnswerSession?: number;
    rounds: any[];
    summary: {
      totalRounds: number;
      totalWords: number;
      finalCompletedWords: number;
      completionRate: number;
    };
  }>;
  evaluationHistory?: Array<{
    date: string;
    taskId: string;
    taskTitle: string;
    targetUnit?: string;
    learningSession: number;
    attemptNumber: number;
    results: Array<{
      wordId: string;
      word: string;
      userAnswer: string;
      correctAnswer: string;
      score: number;
      isCorrect: boolean;
    }>;
    summary: {
      totalWords: number;
      correctWords: number;
      incorrectWords: number;
      accuracy: number;
      passed: boolean;
    };
  }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 0.5 }}>{children}</Box>}
    </div>
  );
}

const StudentPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<TaskAssignment | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openMobileDetail, setOpenMobileDetail] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [showVocabularyLearning, setShowVocabularyLearning] = useState(false);
  const [showVocabularyEvaluation, setShowVocabularyEvaluation] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [timerDuration, setTimerDuration] = useState(() => {
    const saved = localStorage.getItem(`timer_duration_${studentId}`);
    return saved ? parseFloat(saved) : 1.5;
  });
  const [openActionDialog, setOpenActionDialog] = useState(false);
  const [selectedTaskForAction, setSelectedTaskForAction] = useState<{assignment: TaskAssignment, date: Date} | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const loadStudentData = async () => {
      if (studentId) {
        try {
          // Supabase 연결 테스트
          await testConnection();
          
          // Supabase에서 학생 데이터 로드 시도
          const supabaseStudent = await studentService.getById(studentId);
          if (supabaseStudent) {
            // Supabase에서 과제 배정 정보 로드
            const assignments = await assignmentService.getByStudentId(studentId);
            
            // 과제 배정 정보를 올바른 형식으로 변환
            const taskAssignments = assignments.map((assignment: any) => ({
              taskId: assignment.task_id,
              taskTitle: assignment.task_title,
              targetUnit: assignment.target_unit,
              status: assignment.status || 'active',
              area: 'vocabulary', // 기본값, 실제로는 task 정보에서 가져와야 함
              learningCount: assignment.learning_count || 0,
              wrongCount: assignment.wrong_count || 0,
              evaluationCount: assignment.evaluation_count || 0,
              weeklySchedule: {}, // 필요시 추가
              startDate: assignment.created_at,
              progress: {
                completed: 0,
                total: 0
              }
            }));
            
            const studentWithAssignments = {
              ...supabaseStudent,
              taskAssignments
            };
            setStudent(studentWithAssignments);
          } else {
            // Supabase에 없으면 로컬 스토리지에서 로드 (fallback)
            const students = loadStudents();
            const foundStudent = students.find(s => s.id === studentId);
            if (foundStudent) {
              setStudent(foundStudent);
            } else {
              navigate('/students');
            }
          }
        } catch (error) {
          console.error('Supabase 로드 실패, 로컬 스토리지 사용:', error);
          // 에러 발생 시 로컬 스토리지에서 로드
          const students = loadStudents();
          const foundStudent = students.find(s => s.id === studentId);
          if (foundStudent) {
            setStudent(foundStudent);
          } else {
            navigate('/students');
          }
        }
      }
    };
    
    loadStudentData();
  }, [studentId, navigate]);

  const getAreaText = (area: string) => {
    switch (area) {
      case 'vocabulary': return '단어';
      case 'phrase': return '구문';
      case 'grammar': return '어법';
      case 'logic': return '논리';
      default: return area;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '진행중';
      case 'completed': return '완료';
      case 'paused': return '일시정지';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'paused': return 'warning';
      default: return 'default';
    }
  };

  const getGradeText = (grade: string) => {
    return grade;
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case '초6':
        return 'warning';
      case '중1':
      case '중2':
      case '중3':
        return 'primary';
      case '고1':
      case '고2':
      case '고3':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleOpenDetailDialog = (assignment: TaskAssignment) => {
    setSelectedAssignment(assignment);
    if (isMobile) {
      setOpenMobileDetail(true);
    } else {
      setOpenDetailDialog(true);
    }
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setOpenMobileDetail(false);
    setSelectedAssignment(null);
  };

  const handleStartVocabularyLearning = (assignment: TaskAssignment & { targetUnit?: string }, targetDate?: Date) => {
    const assignmentWithDate = targetDate 
      ? { ...assignment, targetDate: targetDate.toISOString() }
      : assignment;
    
    setSelectedAssignment(assignmentWithDate);
    setShowVocabularyLearning(true);
  };

  const handleStartWrongAnswerLearning = (assignment: TaskAssignment & { targetUnit?: string }, targetDate?: Date) => {
    if (!student) {
      alert('학생 정보를 찾을 수 없습니다.');
      return;
    }
    
    const targetUnit = assignment.targetUnit;
    const learningRecords = student.learningHistory?.filter(
      history => history.taskId === assignment.taskId && 
                 (!targetUnit || (history as any).targetUnit === targetUnit) &&
                 !history.isWrongAnswerLearning
    ) || [];
    
    if (learningRecords.length === 0) {
      alert('먼저 학습을 완료해야 오답학습을 진행할 수 있습니다.');
      return;
    }
    
    const firstLearning = learningRecords[0];
    const wrongWords: any[] = [];
    
    if (firstLearning.rounds && firstLearning.rounds.length > 0) {
      const firstRound = firstLearning.rounds[0];
      
      if (firstRound.wordStates && Array.isArray(firstRound.wordStates)) {
        firstRound.wordStates.forEach((state: any) => {
          if (state.status === 'forgot' || state.status === 'repeat' || state.status === 'unknown') {
            // VocabularyWord 구조에 맞게 수정
            const word = state.word;
            console.log('오답학습 단어 데이터:', word);
            
            const wrongWord = {
              ...word,
              id: word.id,
              english: word.english,
              korean: word.korean || word.meaning, // meaning 필드도 확인
              pronunciation: word.pronunciation,
              unit: word.unit
            };
            
            console.log('처리된 오답학습 단어:', wrongWord);
            wrongWords.push(wrongWord);
          }
        });
      }
    }
    
    if (wrongWords.length === 0) {
      alert('오답학습할 단어가 없습니다. 모든 단어를 잘 알고 있습니다!');
      return;
    }
    
    const wrongAnswerRecords = student.learningHistory?.filter(
      history => history.taskId === assignment.taskId && 
                 (!targetUnit || (history as any).targetUnit === targetUnit) &&
                 history.isWrongAnswerLearning
    ) || [];
    
    const wrongAnswerSession = wrongAnswerRecords.length + 1;
    
    const wrongAnswerAssignment = {
      ...assignment,
      targetDate: targetDate?.toISOString() || new Date().toISOString(),
      vocabularyData: wrongWords,
      isWrongAnswerLearning: true,
      wrongAnswerSession: wrongAnswerSession
    };
    
    setSelectedAssignment(wrongAnswerAssignment);
    setShowVocabularyLearning(true);
  };

  const handleStartEvaluation = (assignment: TaskAssignment & { targetUnit?: string }, targetDate?: Date) => {
    if (!student) {
      alert('학생 정보를 찾을 수 없습니다.');
      return;
    }
    
    const targetUnit = assignment.targetUnit;
    const learningRecords = student.learningHistory?.filter(
      history => history.taskId === assignment.taskId && 
                 (!targetUnit || (history as any).targetUnit === targetUnit) &&
                 !history.isWrongAnswerLearning
    ) || [];
    
    if (learningRecords.length === 0) {
      alert('먼저 학습을 완료해야 평가를 진행할 수 있습니다.');
      return;
    }
    
    const wrongAnswerRecords = student.learningHistory?.filter(
      history => history.taskId === assignment.taskId && 
                 (!targetUnit || (history as any).targetUnit === targetUnit) &&
                 history.isWrongAnswerLearning
    ) || [];
    
    if (wrongAnswerRecords.length === 0) {
      alert('먼저 오답학습을 완료해야 평가를 진행할 수 있습니다.');
      return;
    }
    
    const firstLearning = learningRecords[0];
    const evaluationWords: any[] = [];
    
    if (firstLearning.rounds && firstLearning.rounds.length > 0) {
      const firstRound = firstLearning.rounds[0];
      
      if (firstRound.wordStates && Array.isArray(firstRound.wordStates)) {
        firstRound.wordStates.forEach((state: any) => {
          if (state.status === 'forgot' || state.status === 'repeat' || state.status === 'unknown') {
            // VocabularyWord 구조에 맞게 수정
            const word = state.word;
            evaluationWords.push({
              ...word,
              id: word.id,
              english: word.english,
              korean: word.korean,
              pronunciation: word.pronunciation,
              unit: word.unit
            });
          }
        });
      }
    }
    
    if (evaluationWords.length === 0) {
      alert('평가할 단어가 없습니다. 모든 단어를 잘 알고 있습니다!');
      return;
    }
    
    const evaluationAssignment = {
      ...assignment,
      targetDate: targetDate?.toISOString() || new Date().toISOString(),
      vocabularyData: evaluationWords,
      isEvaluation: true
    };
    
    setSelectedAssignment(evaluationAssignment);
    setShowVocabularyEvaluation(true);
  };

  const handleCompleteVocabularyEvaluation = (results: any[]) => {
    if (!student || !selectedAssignment) return;
    
    const evaluationDate = selectedAssignment.targetDate 
      ? new Date(selectedAssignment.targetDate) 
      : new Date();
    
    const totalWords = results.length;
    const correctWords = results.filter(r => r.isCorrect).length;
    const incorrectWords = totalWords - correctWords;
    const accuracy = Math.round((correctWords / totalWords) * 100);
    const passed = correctWords === totalWords;
    
    const targetUnit = (selectedAssignment as any).targetUnit;
    const learningRecords = student.learningHistory?.filter(
      history => history.taskId === selectedAssignment.taskId && 
                 (!targetUnit || (history as any).targetUnit === targetUnit)
    ) || [];
    const latestLearning = learningRecords[learningRecords.length - 1];
    
    if (!latestLearning) {
      console.error('No learning record found for evaluation');
      return;
    }
    
    const evaluationRecord = {
      date: evaluationDate.toISOString(),
      taskId: selectedAssignment.taskId,
      taskTitle: selectedAssignment.taskTitle,
      targetUnit: targetUnit,
      learningSession: latestLearning.learningSession,
      attemptNumber: 1,
      results: results,
      summary: {
        totalWords,
        correctWords,
        incorrectWords,
        accuracy,
        passed
      }
    };
    
    const updatedStudent = { ...student };
    
    if (!updatedStudent.evaluationHistory) {
      updatedStudent.evaluationHistory = [];
    }
    
    updatedStudent.evaluationHistory.push(evaluationRecord);
    
    const students = loadStudents();
    const studentIndex = students.findIndex(s => s.id === student.id);
    if (studentIndex !== -1) {
      students[studentIndex] = updatedStudent;
      saveStudents(students);
      setStudent(updatedStudent);
    }
    
    if (passed) {
      alert(`평가를 통과했습니다! 🎉\n정답률: ${accuracy}%`);
    } else {
      alert(`평가 완료\n정답: ${correctWords}/${totalWords} (${accuracy}%)\n다시 학습을 진행해주세요.`);
    }
    
    setShowVocabularyEvaluation(false);
    setSelectedAssignment(null);
  };

  const handleCompleteVocabularyLearning = (results: any[]) => {
    if (!student || !selectedAssignment) return;
    
    const learningDate = selectedAssignment.targetDate 
      ? new Date(selectedAssignment.targetDate) 
      : new Date();
    
    const totalRounds = results.length;
    const finalResult = results[results.length - 1];
    const totalWords = results[0].totalWords;
    
    let finalCompletedWords;
    if (finalResult.actualFinalCompletedWords !== undefined) {
      finalCompletedWords = finalResult.actualFinalCompletedWords;
    } else {
      const firstRoundCompleted = results.length > 1 
        ? totalWords - results[1].totalWords 
        : results[0].completedWords;
      
      const lastRoundCompleted = results.length > 1
        ? finalResult.completedWords
        : 0;
      
      finalCompletedWords = firstRoundCompleted + lastRoundCompleted;
    }
    
    const updatedStudent = { ...student };
    
    if (!updatedStudent.learningHistory) {
      updatedStudent.learningHistory = [];
    }
    
    const targetUnit = (selectedAssignment as any).targetUnit;
    const previousLearningCount = updatedStudent.learningHistory.filter(
      history => history.taskId === selectedAssignment.taskId && 
                 (!targetUnit || (history as any).targetUnit === targetUnit)
    ).length;
    
    const learningRecord = {
      date: learningDate.toISOString(),
      taskId: selectedAssignment.taskId,
      taskTitle: selectedAssignment.taskTitle,
      targetUnit: targetUnit,
      learningSession: previousLearningCount + 1,
      isFirstLearning: previousLearningCount === 0,
      isWrongAnswerLearning: selectedAssignment.isWrongAnswerLearning || false,
      wrongAnswerSession: selectedAssignment.wrongAnswerSession,
      rounds: results,
      summary: {
        totalRounds,
        totalWords,
        finalCompletedWords,
        completionRate: Math.round((finalCompletedWords / totalWords) * 100),
      }
    };
    
    updatedStudent.learningHistory.push(learningRecord);
    
    const assignmentIndex = updatedStudent.taskAssignments.findIndex(
      a => a.taskId === selectedAssignment.taskId
    );
    
    if (assignmentIndex !== -1) {
      updatedStudent.taskAssignments[assignmentIndex].progress.completed += finalCompletedWords;
      
      const totalProgress = updatedStudent.taskAssignments[assignmentIndex].progress.total;
      if (updatedStudent.taskAssignments[assignmentIndex].progress.completed > totalProgress) {
        updatedStudent.taskAssignments[assignmentIndex].progress.completed = totalProgress;
      }
    }
    
    const students = loadStudents();
    const studentIndex = students.findIndex(s => s.id === student.id);
    if (studentIndex !== -1) {
      students[studentIndex] = updatedStudent;
      saveStudents(students);
      setStudent(updatedStudent);
    }
    
    if (selectedAssignment.isWrongAnswerLearning) {
      localStorage.removeItem('wrongAnswerLearningState');
    }
    
    let sessionText;
    if (selectedAssignment.isWrongAnswerLearning) {
      const wrongAnswerSession = selectedAssignment.wrongAnswerSession || 1;
      sessionText = `${wrongAnswerSession}회차 오답학습`;
    } else {
      sessionText = learningRecord.learningSession === 1 ? '최초 학습' : `${learningRecord.learningSession}회차 학습`;
    }
    const sessionType = selectedAssignment.isWrongAnswerLearning ? '오답학습' : '학습';
    alert(`${sessionType}이 완료되었습니다!\n\n총 ${totalRounds}회차 학습\n전체 ${totalWords}개 단어 중 ${finalCompletedWords}개 완료 (${learningRecord.summary.completionRate}%)`);
    
    setShowVocabularyLearning(false);
    setSelectedAssignment(null);
  };

  const handleCloseVocabularyLearning = () => {
    setShowVocabularyLearning(false);
    setSelectedAssignment(null);
  };

  const handleRestartLearning = () => {
    const existingAssignment = student?.taskAssignments?.find(
      a => a.taskId === selectedAssignment?.taskId
    );
    const startUnit = existingAssignment?.startUnit || '';
    
    const tasks = loadTasks();
    const targetTask = tasks.find((t: any) => 
      t.id === selectedAssignment?.taskId || t.title === selectedAssignment?.taskTitle
    );
    
    if (!targetTask) {
      alert('과제를 찾을 수 없습니다.');
      return;
    }
    
    const assignment: TaskAssignment = {
      taskId: targetTask.id,
      taskTitle: targetTask.title,
      area: targetTask.area,
      weeklySchedule: {
        '월': { isActive: true, dailyAmount: '5' },
        '화': { isActive: true, dailyAmount: '5' },
        '수': { isActive: true, dailyAmount: '5' },
        '목': { isActive: true, dailyAmount: '5' },
        '금': { isActive: true, dailyAmount: '5' },
        '토': { isActive: false, dailyAmount: '0' },
        '일': { isActive: false, dailyAmount: '0' },
      },
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
      progress: {
        completed: 0,
        total: targetTask.vocabularyData?.length || 0,
      },
      vocabularyData: targetTask.vocabularyData,
      startUnit: startUnit,
    };
    
    if (student) {
      const updatedStudent = {
        ...student,
        taskAssignments: [assignment],
      };
      
      const students = loadStudents();
      const updatedStudents = students.map(s => 
        s.id === student.id ? updatedStudent : s
      );
      saveStudents(updatedStudents);
      
      setStudent(updatedStudent);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 학습 진행 현황 계산 함수들
  const getLearningCount = (assignment: TaskAssignment & { targetUnit?: string }, targetDate: Date) => {
    if (!student) return 0;
    
    const targetUnit = assignment.targetUnit;
    
    console.log('getLearningCount 호출:', {
      taskId: assignment.taskId,
      targetUnit,
      learningHistory: student.learningHistory?.length || 0
    });
    
    const count = student.learningHistory?.filter(
      history => {
        const taskMatch = history.taskId === assignment.taskId;
        const unitMatch = !targetUnit || (history as any).targetUnit === targetUnit;
        const notWrongAnswer = !history.isWrongAnswerLearning;
        
        console.log('학습 기록 필터링:', {
          historyTaskId: history.taskId,
          historyTargetUnit: (history as any).targetUnit,
          historyDate: history.date,
          isWrongAnswer: history.isWrongAnswerLearning,
          taskMatch,
          unitMatch,
          notWrongAnswer
        });
        
        return taskMatch && unitMatch && notWrongAnswer;
      }
    ).length || 0;
    
    console.log('최종 학습 횟수:', count);
    return count;
  };

  const getWrongAnswerLearningCount = (assignment: TaskAssignment & { targetUnit?: string }, targetDate: Date) => {
    if (!student) return 0;
    
    const targetUnit = assignment.targetUnit;
    
    console.log('getWrongAnswerLearningCount 호출:', {
      taskId: assignment.taskId,
      targetUnit
    });
    
    const count = student.learningHistory?.filter(
      history => {
        const taskMatch = history.taskId === assignment.taskId;
        const unitMatch = !targetUnit || (history as any).targetUnit === targetUnit;
        const isWrongAnswer = history.isWrongAnswerLearning;
        
        return taskMatch && unitMatch && isWrongAnswer;
      }
    ).length || 0;
    
    console.log('최종 오답학습 횟수:', count);
    return count;
  };

  const getEvaluationCount = (assignment: TaskAssignment & { targetUnit?: string }, targetDate: Date) => {
    if (!student) return 0;
    
    const targetUnit = assignment.targetUnit;
    
    console.log('getEvaluationCount 호출:', {
      taskId: assignment.taskId,
      targetUnit,
      evaluationHistory: student.evaluationHistory?.length || 0
    });
    
    const count = student.evaluationHistory?.filter(
      evaluation => {
        const taskMatch = evaluation.taskId === assignment.taskId;
        const unitMatch = !targetUnit || (evaluation as any).targetUnit === targetUnit;
        
        return taskMatch && unitMatch;
      }
    ).length || 0;
    
    console.log('최종 평가 횟수:', count);
    return count;
  };

  const getProgressStatus = (assignment: TaskAssignment & { targetUnit?: string }, targetDate: Date) => {
    const learningCount = getLearningCount(assignment, targetDate);
    const wrongAnswerCount = getWrongAnswerLearningCount(assignment, targetDate);
    const evaluationCount = getEvaluationCount(assignment, targetDate);
    
    return { learningCount, wrongAnswerCount, evaluationCount };
  };



  const getTodayAssignments = () => {
    if (!student) return [];
    
    const today = new Date();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const todayDayName = dayNames[today.getDay()];
    
    const todayTasks = student.taskAssignments.filter(assignment => {
      if (assignment.status !== 'active') return false;
      
      const todaySchedule = assignment.weeklySchedule?.[todayDayName];
      if (!todaySchedule?.isActive) return false;
      
      const assignmentStartDate = new Date(assignment.startDate);
      assignmentStartDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (assignmentStartDate > today) return false;
      
      if (assignment.endDate) {
        const assignmentEndDate = new Date(assignment.endDate);
        assignmentEndDate.setHours(0, 0, 0, 0);
        if (assignmentEndDate < today) return false;
      }
      
      return true;
    });
    
    if (todayTasks.length === 0) {
      return [{
        taskId: 'dummy',
        taskTitle: 'dummy',
        area: 'vocabulary' as const,
        weeklySchedule: {},
        startDate: '',
        status: 'active' as const,
        progress: { completed: 0, total: 0 },
      }];
    }
    
    return todayTasks;
  };

  const getActiveAssignments = () => {
    if (!student) return [];
    return student.taskAssignments.filter(assignment => assignment.status === 'active');
  };

  const getUpcomingAssignments = () => {
    if (!student) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const assignments: { date: Date; dayName: string; assignments: (TaskAssignment & { targetUnit?: string })[] }[] = [];
    
    for (let i = 0; i < 3; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dayName = dayNames[targetDate.getDay()];
      
      const dayAssignments = student.taskAssignments.filter(assignment => {
        if (assignment.status !== 'active') return false;
        
        const daySchedule = assignment.weeklySchedule?.[dayName];
        if (!daySchedule?.isActive) return false;
        
        const assignmentStartDate = new Date(assignment.startDate);
        assignmentStartDate.setHours(0, 0, 0, 0);
        if (assignmentStartDate > targetDate) return false;
        
        if (assignment.endDate) {
          const assignmentEndDate = new Date(assignment.endDate);
          assignmentEndDate.setHours(0, 0, 0, 0);
          if (assignmentEndDate < targetDate) return false;
        }
        
        return true;
      });
      
      const unitSeparatedAssignments: (TaskAssignment & { targetUnit?: string })[] = [];
      
      dayAssignments.forEach(assignment => {
        const daySchedule = assignment.weeklySchedule?.[dayName];
        const dailyAmount = Number(daySchedule?.dailyAmount) || 0;
        
        if (dailyAmount > 0 && assignment.vocabularyData) {
          const unitOrder: string[] = [];
          const unitSet = new Set<string>();
          
          assignment.vocabularyData.forEach((word: any) => {
            if (!unitSet.has(word.unit)) {
              unitSet.add(word.unit);
              unitOrder.push(word.unit);
            }
          });
          
          // 최초 시작단원 찾기
          let startUnitIndex = 0;
          if (assignment.startUnit) {
            const foundIndex = unitOrder.findIndex(unit => unit === assignment.startUnit);
            if (foundIndex !== -1) {
              startUnitIndex = foundIndex;
            }
          }
          
          // 날짜별 단원 계산을 위한 변수
          const assignmentStartDate = new Date(assignment.startDate);
          assignmentStartDate.setHours(0, 0, 0, 0);
          
          const dayNamesArray = ['일', '월', '화', '수', '목', '금', '토'];
          const targetDayName = dayNamesArray[targetDate.getDay()];
          const targetDaySchedule = assignment.weeklySchedule?.[targetDayName];
          
          // 해당 날짜가 학습일인 경우에만 처리
          if (targetDaySchedule?.isActive) {
            // 시작일부터 목표일까지 누적 학습량 계산
            let cumulativeUnits = 0;
            const tempDate = new Date(assignmentStartDate);
            
            while (tempDate < targetDate) {
              const tempDayName = dayNamesArray[tempDate.getDay()];
              const tempDaySchedule = assignment.weeklySchedule?.[tempDayName];
              
              if (tempDaySchedule?.isActive) {
                cumulativeUnits += Number(tempDaySchedule.dailyAmount) || 0;
              }
              
              tempDate.setDate(tempDate.getDate() + 1);
            }
            
            // 현재 날짜의 단원 계산 (누적 학습량 기준)
            const currentDayStartIndex = startUnitIndex + cumulativeUnits;
            const currentDayAmount = Number(targetDaySchedule.dailyAmount) || 0;
            
            for (let i = 0; i < currentDayAmount; i++) {
              const unitIndex = currentDayStartIndex + i;
              if (unitIndex >= 0 && unitIndex < unitOrder.length) {
                unitSeparatedAssignments.push({
                  ...assignment,
                  targetUnit: unitOrder[unitIndex]
                });
              }
            }
          } else {
            // 비활성 날짜인 경우, 가장 최근 활성일의 단원을 표시
            let lastActiveDate = new Date(targetDate);
            lastActiveDate.setDate(lastActiveDate.getDate() - 1);
            
            while (lastActiveDate >= assignmentStartDate) {
              const lastDayName = dayNamesArray[lastActiveDate.getDay()];
              const lastDaySchedule = assignment.weeklySchedule?.[lastDayName];
              
              if (lastDaySchedule?.isActive) {
                // 마지막 활성일까지의 누적 학습량 계산
                let cumulativeUnitsUntilLast = 0;
                const tempDate = new Date(assignmentStartDate);
                
                while (tempDate <= lastActiveDate) {
                  const tempDayName = dayNamesArray[tempDate.getDay()];
                  const tempDaySchedule = assignment.weeklySchedule?.[tempDayName];
                  
                  if (tempDaySchedule?.isActive) {
                    cumulativeUnitsUntilLast += Number(tempDaySchedule.dailyAmount) || 0;
                  }
                  
                  tempDate.setDate(tempDate.getDate() + 1);
                }
                
                // 마지막 활성일의 단원 표시
                const lastDayStartIndex = startUnitIndex + cumulativeUnitsUntilLast;
                const lastDayAmount = Number(lastDaySchedule.dailyAmount) || 0;
                
                for (let i = 0; i < lastDayAmount; i++) {
                  const unitIndex = lastDayStartIndex + i;
                  if (unitIndex >= 0 && unitIndex < unitOrder.length) {
                    unitSeparatedAssignments.push({
                      ...assignment,
                      targetUnit: unitOrder[unitIndex]
                    });
                  }
                }
                break;
              }
              
              lastActiveDate.setDate(lastActiveDate.getDate() - 1);
            }
          }
        } else {
          unitSeparatedAssignments.push(assignment);
        }
      });
      
      if (unitSeparatedAssignments.length > 0 || i === 0) {
        assignments.push({
          date: targetDate,
          dayName: dayName,
          assignments: unitSeparatedAssignments
        });
      }
    }
    
    return assignments;
  };

  if (!student) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6">학생 정보를 불러오는 중...</Typography>
      </Box>
    );
  }

  const todayAssignments = getTodayAssignments();
  const activeAssignments = getActiveAssignments();

  return (
    <Box sx={{ pb: isMobile ? 8 : 0 }}>


      <Container maxWidth="lg" sx={{ px: isMobile ? 2 : 3, py: isMobile ? 2 : 3 }}>




        {/* 탭 네비게이션 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              '& .MuiTab-root': {
                minHeight: isMobile ? 56 : 48,
                fontSize: isMobile ? '0.875rem' : '1rem',
              }
            }}
          >
            <Tab 
              icon={<TodayIcon />} 
              iconPosition="start"
              sx={{ 
                '& .MuiTab-iconWrapper': { mr: 0 },
                '& .MuiTab-labelIcon': { flexDirection: 'row' }
              }}
            />
            <Tab 
              icon={<ViewModuleIcon />} 
              iconPosition="start"
              sx={{ 
                '& .MuiTab-iconWrapper': { mr: 0 },
                '& .MuiTab-labelIcon': { flexDirection: 'row' }
              }}
            />
            <Tab 
              icon={<SettingsIcon />} 
              iconPosition="start"
              sx={{ 
                '& .MuiTab-iconWrapper': { mr: 0 },
                '& .MuiTab-labelIcon': { flexDirection: 'row' }
              }}
            />
          </Tabs>
        </Box>

        {/* 오늘의 과제 탭 */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 1 }}>
            {todayAssignments.length > 0 ? (
              <Box>
                {(() => {
                  const upcomingDays = getUpcomingAssignments();
                  
                  // 관리자 페이지에서 등록된 모든 영역 가져오기
                  const allAreas = new Set<string>();
                  
                  // 학생에게 배정된 과제의 영역들
                  upcomingDays.forEach(dayData => {
                    dayData.assignments.forEach(assignment => {
                      if (assignment.area) {
                        allAreas.add(assignment.area);
                      }
                    });
                  });
                  
                  // 관리자 페이지에서 등록된 모든 영역 추가 (과제가 없어도 표시)
                  const registeredAreas = ['vocabulary', 'phrase', 'grammar', 'logic'];
                  registeredAreas.forEach(area => {
                    allAreas.add(area);
                  });
                  
                  const filteredUpcomingDays = upcomingDays.map(dayData => ({
                    ...dayData,
                    assignments: selectedArea === 'all' 
                      ? dayData.assignments 
                      : dayData.assignments.filter(assignment => assignment.area === selectedArea)
                  }));
                  
                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
                        <ToggleButtonGroup
                          value={selectedArea}
                          exclusive
                          onChange={(event, newArea) => {
                            if (newArea !== null) {
                              setSelectedArea(newArea);
                            }
                          }}
                          aria-label="area filter"
                          size="small"
                        >
                          <ToggleButton value="all" aria-label="all areas">
                            전체
                          </ToggleButton>
                          {Array.from(allAreas).map((area: string) => (
                            <ToggleButton key={area} value={area} aria-label={area}>
                              {getAreaText(area)}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      </Box>
                      
                      {filteredUpcomingDays.length > 0 ? (
                        filteredUpcomingDays.map((dayData, dayIndex) => {
                          const dateLabel = dayIndex === 0 ? '오늘' : 
                                          dayIndex === 1 ? '내일' : '모레';
                          const dateString = `${dayData.date.getMonth() + 1}월 ${dayData.date.getDate()}일 (${dayData.dayName})`;
                          
                          return (
                            <Box key={dayIndex}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  mb: 2, 
                                  fontWeight: 600,
                                  color: dayIndex === 0 ? 'primary.main' : 'text.primary'
                                }}
                              >
                                {dateLabel} - {dateString}
                              </Typography>
                              
                              {dayData.assignments.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {dayData.assignments.map((assignment, idx) => (
                                    <Box
                                      key={idx}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        p: 2,
                                        border: '1px solid',
                                        borderColor: dayIndex === 0 ? 'primary.light' : 'grey.300',
                                        borderRadius: 1,
                                        bgcolor: 'background.paper',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        '&:hover': {
                                          bgcolor: 'primary.50',
                                          borderColor: 'primary.main',
                                          transform: 'translateY(-1px)',
                                          boxShadow: 2
                                        },
                                        transition: 'all 0.2s ease-in-out'
                                      }}
                                      onClick={() => {
                                        setSelectedTaskForAction({ assignment: assignment as TaskAssignment, date: dayData.date });
                                        setOpenActionDialog(true);
                                      }}
                                    >
                                      <Box sx={{ flex: 1 }}>
                                        <Box sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center',
                                          gap: 1,
                                          mb: 0.5
                                        }}>
                                          <Typography variant="subtitle1" sx={{ 
                                            fontWeight: 600,
                                            fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
                                            lineHeight: 1.2,
                                            wordBreak: 'break-word',
                                            flex: 1,
                                            minWidth: 0
                                          }}>
                                            {assignment.taskTitle}
                                            {assignment.targetUnit && (
                                              <Typography component="span" variant="body2" sx={{ 
                                                fontSize: 'clamp(0.8rem, 2.2vw, 0.95rem)',
                                                whiteSpace: 'nowrap',
                                                ml: 0.5,
                                                fontWeight: 700,
                                                color: 'black'
                                              }}>
                                                {assignment.targetUnit}
                                              </Typography>
                                            )}
                                          </Typography>
                                          
                                          {(() => {
                                            const progress = getProgressStatus(assignment, dayData.date);
                                            const chips = [];
                                            
                                            // 항상 회수 표시 (0회라도)
                                            chips.push(
                                              <Chip
                                                key="learning"
                                                label={`${progress.learningCount}회`}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{ fontSize: '0.7rem', height: 20 }}
                                              />
                                            );
                                            
                                            chips.push(
                                              <Chip
                                                key="wrong"
                                                label={`${progress.wrongAnswerCount}회`}
                                                size="small"
                                                color="warning"
                                                variant="outlined"
                                                sx={{ fontSize: '0.7rem', height: 20 }}
                                              />
                                            );
                                            
                                            chips.push(
                                              <Chip
                                                key="evaluation"
                                                label={`${progress.evaluationCount}회`}
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                                sx={{ fontSize: '0.7rem', height: 20 }}
                                              />
                                            );
                                            
                                            return (
                                              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                                {chips}
                                              </Box>
                                            );
                                          })()}
                                        </Box>
                                      </Box>
                                      

                                    </Box>
                                  ))}
                                </Box>
                              ) : (
                                <Card sx={{ borderRadius: isMobile ? 2 : 1, textAlign: 'center', bgcolor: 'grey.50' }}>
                                  <CardContent sx={{ py: 3 }}>
                                    <Typography variant="body1" color="text.secondary">
                                      {dateLabel} 과제가 없습니다
                                    </Typography>
                                  </CardContent>
                                </Card>
                              )}
                            </Box>
                          );
                        })
                      ) : null}
                    </Box>
                  );
                })()}
              </Box>
            ) : (
              <Card sx={{ borderRadius: isMobile ? 2 : 1, textAlign: 'center' }}>
                <CardContent sx={{ py: isMobile ? 6 : 4 }}>
                  <CalendarIcon sx={{ 
                    fontSize: isMobile ? 80 : 64, 
                    color: 'text.secondary', 
                    mb: 2 
                  }} />
                  <Typography variant={isMobile ? "h6" : "h6"} color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                    오늘의 과제가 없습니다
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    오늘은 학습이 예정되어 있지 않습니다.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size={isMobile ? "large" : "medium"}
                    onClick={handleRestartLearning}
                    startIcon={<RefreshIcon />}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: 2,
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-1px)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                  >
                    학습 시작하기
                  </Button>
                </CardContent>
              </Card>
            )}
          </Box>
        </TabPanel>

        {/* 과제 현황 탭 */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ViewModuleIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600 }}>
                과제 현황 ({activeAssignments.length}개)
              </Typography>
            </Box>

            {activeAssignments.length > 0 ? (
              <Grid container spacing={isMobile ? 2 : 3}>
                {activeAssignments.map((assignment, index) => (
                  <Grid item xs={12} sm={6} md={4} key={`${assignment.taskId}-${index}`}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        borderRadius: isMobile ? 2 : 1,
                        '&:hover': { 
                          boxShadow: isMobile ? 2 : 3,
                          transform: isMobile ? 'none' : 'translateY(-2px)',
                          transition: 'all 0.2s ease-in-out'
                        },
                        minHeight: isMobile ? 200 : 'auto'
                      }}
                      onClick={() => handleOpenDetailDialog(assignment)}
                    >
                      <CardContent sx={{ p: isMobile ? 3 : 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography 
                            variant={isMobile ? "h6" : "h6"} 
                            sx={{ 
                              flex: 1, 
                              fontSize: isMobile ? '1rem' : '1.25rem',
                              lineHeight: 1.3
                            }}
                          >
                            {assignment.taskTitle}
                          </Typography>
                          <Chip
                            label={getStatusText(assignment.status)}
                            color={getStatusColor(assignment.status) as any}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <AssignmentIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
                            <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                              {getAreaText(assignment.area)} 영역
                            </Typography>
                          </Box>
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                진행률
                              </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {Math.round((assignment.progress.completed / assignment.progress.total) * 100)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={(assignment.progress.completed / assignment.progress.total) * 100}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {assignment.progress.completed} / {assignment.progress.total} 완료
                              </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Card sx={{ borderRadius: isMobile ? 2 : 1, textAlign: 'center' }}>
                <CardContent sx={{ py: isMobile ? 6 : 4 }}>
                  <AssignmentIcon sx={{ 
                    fontSize: isMobile ? 80 : 64, 
                    color: 'text.secondary', 
                    mb: 2 
                  }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                    배정된 과제가 없습니다
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    관리자에게 과제 배정을 요청하세요.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </TabPanel>

        {/* 설정 탭 */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600 }}>
                설정
              </Typography>
            </Box>

                <Card sx={{ borderRadius: isMobile ? 2 : 1 }}>
                  <CardContent sx={{ p: isMobile ? 3 : 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  타이머 설정
                      </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <TimerIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="body1" sx={{ flex: 1 }}>
                    단어당 학습 시간: {timerDuration}초
                    </Typography>
                </Box>
                      <Slider
                        value={timerDuration}
                  onChange={(event, newValue) => {
                    const duration = newValue as number;
                    setTimerDuration(duration);
                    localStorage.setItem(`timer_duration_${studentId}`, duration.toString());
                  }}
                        min={0.5}
                  max={5.0}
                  step={0.1}
                        marks={[
                          { value: 0.5, label: '0.5초' },
                    { value: 1.0, label: '1초' },
                          { value: 1.5, label: '1.5초' },
                    { value: 2.0, label: '2초' },
                    { value: 3.0, label: '3초' },
                    { value: 5.0, label: '5초' }
                  ]}
                  valueLabelDisplay="auto"
                  sx={{ mt: 2 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  단어를 보고 뜻을 생각할 수 있는 시간을 설정합니다.
                      </Typography>
                  </CardContent>
                </Card>
          </Box>
        </TabPanel>

        {/* 상세보기 다이얼로그 */}
        <Dialog 
          open={openDetailDialog} 
          onClose={handleCloseDetailDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">과제 상세 정보</Typography>
              <IconButton onClick={handleCloseDetailDialog}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedAssignment && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  {selectedAssignment.taskTitle}
                    </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                  <Chip
                    label={getAreaText(selectedAssignment.area)}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={getStatusText(selectedAssignment.status)}
                    color={getStatusColor(selectedAssignment.status) as any}
                    size="small"
                  />
                    </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                    진행률: {Math.round((selectedAssignment.progress.completed / selectedAssignment.progress.total) * 100)}%
                    </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(selectedAssignment.progress.completed / selectedAssignment.progress.total) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      주간 스케줄
                    </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {['월', '화', '수', '목', '금', '토', '일'].map((day) => {
                            const schedule = selectedAssignment.weeklySchedule[day];
                            return (
                      <Box
                        key={day}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2,
                          borderRadius: 1,
                          backgroundColor: schedule?.isActive ? 'primary.50' : 'grey.50',
                          border: schedule?.isActive ? '1px solid' : '1px solid',
                          borderColor: schedule?.isActive ? 'primary.200' : 'grey.200',
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {day}요일
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {schedule?.isActive ? schedule.dailyAmount : '학습 없음'}
                          </Typography>
                          <Chip
                            label={schedule?.isActive ? '활성' : '비활성'}
                            color={schedule?.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      </Box>
                            );
                          })}
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* 모바일 상세보기 드로어 */}
        <Drawer
          anchor="bottom"
          open={openMobileDetail}
          onClose={handleCloseDetailDialog}
          sx={{
            '& .MuiDrawer-paper': {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '90vh',
            },
          }}
        >
          {selectedAssignment && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  과제 상세 정보
                </Typography>
                <IconButton onClick={handleCloseDetailDialog}>
                  <CloseIcon />
                </IconButton>
              </Box>

              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {selectedAssignment.taskTitle}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Chip
                  label={getAreaText(selectedAssignment.area)}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={getStatusText(selectedAssignment.status)}
                  color={getStatusColor(selectedAssignment.status) as any}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                  진행률: {Math.round((selectedAssignment.progress.completed / selectedAssignment.progress.total) * 100)}%
              </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(selectedAssignment.progress.completed / selectedAssignment.progress.total) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                주간 스케줄
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {['월', '화', '수', '목', '금', '토', '일'].map((day) => {
                  const schedule = selectedAssignment.weeklySchedule[day];
                  return (
                    <Box
                      key={day}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 1,
                        backgroundColor: schedule?.isActive ? 'primary.50' : 'grey.50',
                        border: schedule?.isActive ? '1px solid' : '1px solid',
                        borderColor: schedule?.isActive ? 'primary.200' : 'grey.200',
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {day}요일
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {schedule?.isActive ? schedule.dailyAmount : '학습 없음'}
                        </Typography>
                        <Chip
                          label={schedule?.isActive ? '활성' : '비활성'}
                          color={schedule?.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Drawer>

        {/* 단어 학습 팝업 */}
        <Dialog
          open={showVocabularyLearning}
          onClose={handleCloseVocabularyLearning}
          fullScreen
          sx={{
            '& .MuiDialog-paper': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          {selectedAssignment && (
            <VocabularyLearning
              assignment={selectedAssignment}
              onComplete={handleCompleteVocabularyLearning}
              onClose={handleCloseVocabularyLearning}
              timerDuration={timerDuration}
            />
          )}
        </Dialog>

        {/* 단어 평가 팝업 */}
        <Dialog
          open={showVocabularyEvaluation}
          onClose={() => {
            setShowVocabularyEvaluation(false);
            setSelectedAssignment(null);
          }}
          fullScreen
          sx={{
            '& .MuiDialog-paper': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          {selectedAssignment && (
            <VocabularyEvaluation
              vocabularyData={(() => {
                const transformedData = (selectedAssignment.vocabularyData || []).map((item: any, index: number) => {
                  const transformed = {
                    id: item.id || `${item.english || item.word}_${item.korean || item.meaning}`,
                    word: item.english || item.word,
                    meaning: item.korean || item.meaning,
                    example: item.example
                  };
                  
                  return transformed;
                });
                
                return transformedData;
              })()}
              onComplete={handleCompleteVocabularyEvaluation}
              onClose={() => {
                setShowVocabularyEvaluation(false);
                setSelectedAssignment(null);
              }}
            />
          )}
        </Dialog>

        {/* 학습 액션 선택 팝업 */}
        <Dialog 
          open={openActionDialog} 
          onClose={() => setOpenActionDialog(false)}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-container': {
              alignItems: 'center',
              justifyContent: 'center',
            },
            '& .MuiDialog-paper': {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              margin: 0,
              maxHeight: '90vh',
              width: isMobile ? '90%' : '400px'
            }
          }}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: 6
            }
          }}
        >
          <DialogTitle sx={{ 
            textAlign: 'center', 
            pb: 1,
            fontSize: isMobile ? '1.3rem' : '1.5rem',
            fontWeight: 600
          }}>
            학습 방법을 선택하세요
          </DialogTitle>
          
          {selectedTaskForAction && (
            <DialogContent sx={{ pt: 1, pb: 2 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h6" color="primary" sx={{ mb: 0.5 }}>
                  {selectedTaskForAction.assignment.taskTitle}
                </Typography>
                {selectedTaskForAction.assignment.targetUnit && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedTaskForAction.assignment.targetUnit}
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => {
                    setOpenActionDialog(false);
                    handleStartVocabularyLearning(selectedTaskForAction.assignment, selectedTaskForAction.date);
                  }}
                  sx={{ 
                    py: isMobile ? 2 : 1.5,
                    fontSize: isMobile ? '1.1rem' : '1rem',
                    fontWeight: 600
                  }}
                >
                  📚 학습
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={() => {
                    setOpenActionDialog(false);
                    handleStartWrongAnswerLearning(selectedTaskForAction.assignment, selectedTaskForAction.date);
                  }}
                  sx={{ 
                    py: isMobile ? 2 : 1.5,
                    fontSize: isMobile ? '1.1rem' : '1rem',
                    fontWeight: 600
                  }}
                >
                  🔄 오답학습
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={() => {
                    setOpenActionDialog(false);
                    handleStartEvaluation(selectedTaskForAction.assignment, selectedTaskForAction.date);
                  }}
                  sx={{ 
                    py: isMobile ? 2 : 1.5,
                    fontSize: isMobile ? '1.1rem' : '1rem',
                    fontWeight: 600
                  }}
                >
                  ✅ 평가
                </Button>
              </Box>
            </DialogContent>
          )}
          
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button 
              onClick={() => setOpenActionDialog(false)}
              sx={{ minWidth: 100 }}
            >
              취소
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default StudentPage;