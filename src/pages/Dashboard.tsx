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
  Avatar,
  useTheme,
  useMediaQuery,
  Container,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Message as MessageIcon,
  WhatsApp as WhatsAppIcon,
  Telegram as TelegramIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { loadStudents, loadTasks, saveStudents } from '../utils/storage';
import { useNavigate } from 'react-router-dom';

interface LearningHistory {
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
}

interface EvaluationHistory {
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
}

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
  learningHistory?: LearningHistory[];
  evaluationHistory?: EvaluationHistory[];
}

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalTasks: number;
  activeTasks: number;
  totalLearningSessions: number;
  totalEvaluations: number;
  averageCompletionRate: number;
  recentActivity: Array<{
    studentName: string;
    activity: string;
    date: string;
    type: 'learning' | 'evaluation' | 'task_assigned';
  }>;
  studentProgress: Array<{
    studentId: string;
    studentName: string;
    grade: string;
    status: string;
    totalAssignments: number;
    completedAssignments: number;
    averageProgress: number;
    assignments: Array<{
      taskTitle: string;
      area: string;
      progress: number;
      status: string;
    }>;
    learningSessions: number;
    evaluationCount: number;
    joinDate: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalTasks: 0,
    activeTasks: 0,
    totalLearningSessions: 0,
    totalEvaluations: 0,
    averageCompletionRate: 0,
    recentActivity: [],
    studentProgress: [],
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // 메신저 발송 관련 상태
  const [messengerDialog, setMessengerDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [messengerType, setMessengerType] = useState<'whatsapp' | 'telegram' | 'sms' | 'kakao'>('whatsapp');

  const calculateStats = () => {
    const students = loadStudents();
    const tasks = loadTasks();

    let totalLearningSessions = 0;
    let totalEvaluations = 0;
    let totalCompletionRate = 0;
    let activeStudentsCount = 0;
    const recentActivity: Array<{
      studentName: string;
      activity: string;
      date: string;
      type: 'learning' | 'evaluation' | 'task_assigned';
    }> = [];

    students.forEach((student: Student) => {
      if (student.status === 'active') {
        activeStudentsCount++;
      }

      // 학습 세션 수 계산
      if (student.learningHistory && Array.isArray(student.learningHistory)) {
        totalLearningSessions += student.learningHistory.length;
        
        // 최근 활동 추가
        student.learningHistory.forEach((session: LearningHistory) => {
          if (session && session.taskTitle && session.date) {
            recentActivity.push({
              studentName: student.name,
              activity: `${session.taskTitle} 학습 완료`,
              date: session.date,
              type: 'learning',
            });
          }
        });
      }

      // 평가 수 계산
      if (student.evaluationHistory && Array.isArray(student.evaluationHistory)) {
        totalEvaluations += student.evaluationHistory.length;
        
        // 최근 활동 추가
        student.evaluationHistory.forEach((evaluation: EvaluationHistory) => {
          if (evaluation && evaluation.taskTitle && evaluation.date) {
            const accuracy = evaluation.summary?.accuracy || 0;
            recentActivity.push({
              studentName: student.name,
              activity: `${evaluation.taskTitle} 평가 완료 (${accuracy}%)`,
              date: evaluation.date,
              type: 'evaluation',
            });
          }
        });
      }

      // 과제 배정 활동 추가
      if (student.taskAssignments && Array.isArray(student.taskAssignments)) {
        student.taskAssignments.forEach((assignment: TaskAssignment) => {
          if (assignment && assignment.taskTitle && assignment.startDate) {
            recentActivity.push({
              studentName: student.name,
              activity: `${assignment.taskTitle} 과제 배정`,
              date: assignment.startDate,
              type: 'task_assigned',
            });
          }
        });
      }

      // 평균 완료율 계산
      if (student.taskAssignments && Array.isArray(student.taskAssignments) && student.taskAssignments.length > 0) {
        const studentCompletionRate = student.taskAssignments.reduce((acc: number, assignment: TaskAssignment) => {
          if (assignment && assignment.progress && assignment.progress.total > 0) {
            return acc + (assignment.progress.completed / assignment.progress.total) * 100;
          }
          return acc;
        }, 0) / student.taskAssignments.length;
        totalCompletionRate += studentCompletionRate;
      }
    });

    // 최근 활동을 날짜순으로 정렬 (최신순)
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const activeTasks = tasks.filter((task: any) => task && task.status === 'active').length;
    const averageCompletionRate = students.length > 0 ? totalCompletionRate / students.length : 0;

    // 학생별 진행상황 계산
    const studentProgress = students.map((student: Student) => {
      const assignments = student.taskAssignments || [];
      const totalAssignments = assignments.length;
      const completedAssignments = assignments.filter(assignment => 
        assignment.status === 'completed'
      ).length;
      
      const averageProgress = assignments.length > 0 
        ? assignments.reduce((acc: number, assignment: TaskAssignment) => {
            if (assignment.progress && assignment.progress.total > 0) {
              return acc + (assignment.progress.completed / assignment.progress.total) * 100;
            }
            return acc;
          }, 0) / assignments.length
        : 0;

      const assignmentDetails = assignments.map((assignment: TaskAssignment) => ({
        taskTitle: assignment.taskTitle,
        area: assignment.area,
        progress: assignment.progress && assignment.progress.total > 0 
          ? Math.round((assignment.progress.completed / assignment.progress.total) * 100)
          : 0,
        status: assignment.status
      }));

      // 학습 세션 수 계산
      const learningSessions = student.learningHistory && Array.isArray(student.learningHistory) 
        ? student.learningHistory.length 
        : 0;

      // 평가 횟수 계산
      const evaluationCount = student.evaluationHistory && Array.isArray(student.evaluationHistory) 
        ? student.evaluationHistory.length 
        : 0;

      return {
        studentId: student.id,
        studentName: student.name,
        grade: student.grade,
        status: student.status,
        totalAssignments,
        completedAssignments,
        averageProgress: Math.round(averageProgress),
        assignments: assignmentDetails,
        learningSessions,
        evaluationCount,
        joinDate: student.joinDate
      };
    });

    setStats({
      totalStudents: students.length,
      activeStudents: activeStudentsCount,
      totalTasks: tasks.length,
      activeTasks,
      totalLearningSessions,
      totalEvaluations,
      averageCompletionRate: Math.round(averageCompletionRate),
      recentActivity: recentActivity.slice(0, 10), // 최근 10개만 표시
      studentProgress,
    });
  };

  useEffect(() => {
    calculateStats();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'learning':
        return <SchoolIcon sx={{ fontSize: 16, color: 'primary.main' }} />;
      case 'evaluation':
        return <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'task_assigned':
        return <AssignmentIcon sx={{ fontSize: 16, color: 'info.main' }} />;
      default:
        return <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'learning':
        return 'primary.main';
      case 'evaluation':
        return 'success.main';
      case 'task_assigned':
        return 'info.main';
      default:
        return 'text.secondary';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '오늘';
    if (diffDays === 2) return '어제';
    if (diffDays <= 7) return `${diffDays - 1}일 전`;
    
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 메신저 발송 관련 함수들
  const handleMessengerClick = (student: any) => {
    setSelectedStudent(student);
    setMessengerDialog(true);
    setMessageText(`안녕하세요 ${student.studentName}님!\n\n학습 진행상황을 확인해보세요.`);
  };

  const handleSendMessage = () => {
    if (!selectedStudent || !messageText.trim()) return;

    const phoneNumber = selectedStudent.phone || '';
    let messengerUrl = '';

    switch (messengerType) {
      case 'whatsapp':
        messengerUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(messageText)}`;
        break;
      case 'telegram':
        // Telegram은 사용자명이나 채널을 통해 발송
        messengerUrl = `https://t.me/${phoneNumber}`;
        break;
      case 'sms':
        messengerUrl = `sms:${phoneNumber}?body=${encodeURIComponent(messageText)}`;
        break;
      case 'kakao':
        // 카카오톡 URL 스킴 (전화번호로 발송)
        messengerUrl = `kakaotalk://open?url=${encodeURIComponent(`https://open.kakao.com/me/${phoneNumber.replace(/[^0-9]/g, '')}`)}`;
        break;
    }

    if (messengerUrl) {
      window.open(messengerUrl, '_blank');
    }

    setMessengerDialog(false);
    setMessageText('');
    setSelectedStudent(null);
  };

  const getMessengerIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <WhatsAppIcon sx={{ fontSize: 20, color: '#25D366' }} />;
      case 'telegram':
        return <TelegramIcon sx={{ fontSize: 20, color: '#0088cc' }} />;
      case 'kakao':
        return <ChatIcon sx={{ fontSize: 20, color: '#FEE500' }} />;
      default:
        return <MessageIcon sx={{ fontSize: 20, color: 'primary.main' }} />;
    }
  };

  // 테스트용 학생 데이터 생성 함수
  const createSampleStudents = () => {
    const sampleStudents = [
      {
        id: '1',
        name: '김학생',
        address: '서울시 강남구',
        phone: '010-1234-5678',
        grade: '중1',
        joinDate: '2024-01-15',
        status: 'active' as const,
        assignedTasks: ['task1', 'task2'],
        taskAssignments: [
          {
            taskId: 'task1',
            taskTitle: '기초 어휘 학습',
            area: 'vocabulary' as const,
            weeklySchedule: {
              monday: { isActive: true, dailyAmount: '10' },
              tuesday: { isActive: true, dailyAmount: '10' },
              wednesday: { isActive: true, dailyAmount: '10' },
              thursday: { isActive: true, dailyAmount: '10' },
              friday: { isActive: true, dailyAmount: '10' },
              saturday: { isActive: false, dailyAmount: '0' },
              sunday: { isActive: false, dailyAmount: '0' }
            },
            startDate: '2024-01-15',
            status: 'active' as const,
            progress: { completed: 7, total: 10 }
          }
        ],
        grades: {},
        learningHistory: [
          {
            date: '2024-01-20',
            taskId: 'task1',
            taskTitle: '기초 어휘 학습',
            learningSession: 1,
            isFirstLearning: true,
            rounds: [],
            summary: {
              totalRounds: 1,
              totalWords: 10,
              finalCompletedWords: 8,
              completionRate: 80
            }
          }
        ],
        evaluationHistory: [
          {
            date: '2024-01-22',
            taskId: 'task1',
            taskTitle: '기초 어휘 학습',
            learningSession: 1,
            attemptNumber: 1,
            results: [],
            summary: {
              totalWords: 10,
              correctWords: 8,
              incorrectWords: 2,
              accuracy: 80,
              passed: true
            }
          }
        ]
      },
      {
        id: '2',
        name: '이학생',
        address: '서울시 서초구',
        phone: '010-9876-5432',
        grade: '중2',
        joinDate: '2024-01-10',
        status: 'active' as const,
        assignedTasks: ['task2', 'task3'],
        taskAssignments: [
          {
            taskId: 'task2',
            taskTitle: '중급 문법 학습',
            area: 'grammar' as const,
            weeklySchedule: {
              monday: { isActive: true, dailyAmount: '15' },
              tuesday: { isActive: true, dailyAmount: '15' },
              wednesday: { isActive: true, dailyAmount: '15' },
              thursday: { isActive: true, dailyAmount: '15' },
              friday: { isActive: true, dailyAmount: '15' },
              saturday: { isActive: false, dailyAmount: '0' },
              sunday: { isActive: false, dailyAmount: '0' }
            },
            startDate: '2024-01-10',
            status: 'active' as const,
            progress: { completed: 12, total: 15 }
          }
        ],
        grades: {},
        learningHistory: [
          {
            date: '2024-01-18',
            taskId: 'task2',
            taskTitle: '중급 문법 학습',
            learningSession: 1,
            isFirstLearning: true,
            rounds: [],
            summary: {
              totalRounds: 1,
              totalWords: 15,
              finalCompletedWords: 12,
              completionRate: 80
            }
          }
        ],
        evaluationHistory: [
          {
            date: '2024-01-21',
            taskId: 'task2',
            taskTitle: '중급 문법 학습',
            learningSession: 1,
            attemptNumber: 1,
            results: [],
            summary: {
              totalWords: 15,
              correctWords: 12,
              incorrectWords: 3,
              accuracy: 80,
              passed: true
            }
          }
        ]
      }
    ];
    
    saveStudents(sampleStudents);
    calculateStats(); // 통계 다시 계산
  };

  return (
    <Box sx={{ width: '100%', px: isMobile ? 2 : 6, py: isMobile ? 2 : 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 600, color: 'text.primary' }}>
            대시보드
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            전체 학습 현황 및 학생 관리
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={createSampleStudents}
          sx={{ minWidth: 'auto' }}
        >
          테스트 학생 추가
        </Button>
      </Box>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {stats.totalStudents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    전체 학생
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {stats.activeStudents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    활성 학생
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                    {stats.totalTasks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    전체 과제
                  </Typography>
                </Box>
                <AssignmentIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                    {stats.averageCompletionRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    평균 완료율
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 학생 목록 */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                학생 목록
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '12%' }}>학생명</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '8%' }}>학년</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '8%' }}>상태</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '12%' }}>평균 진행률</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '15%' }}>과제 현황</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '9%' }}>학습 세션</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '9%' }}>평가 횟수</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '9%' }}>가입일</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '8%' }}>메신저</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '7%' }}>세부 정보</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.studentProgress.map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {student.studentName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={student.grade} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={student.status === 'active' ? '활성' : '비활성'} 
                            size="small" 
                            color={student.status === 'active' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={student.averageProgress} 
                              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2" sx={{ minWidth: 35 }}>
                              {student.averageProgress}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {student.completedAssignments}/{student.totalAssignments} 완료
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
                              {student.learningSessions}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                              {student.evaluationCount}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(student.joinDate).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            }).replace(/\./g, '.').replace(/\s/g, '')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="WhatsApp으로 메시지 보내기">
                              <IconButton 
                                size="small"
                                onClick={() => handleMessengerClick(student)}
                                sx={{ p: 0.5 }}
                              >
                                <WhatsAppIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="카카오톡으로 메시지 보내기">
                              <IconButton 
                                size="small"
                                onClick={() => handleMessengerClick(student)}
                                sx={{ p: 0.5 }}
                              >
                                <ChatIcon sx={{ fontSize: 16, color: '#FEE500' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="SMS로 메시지 보내기">
                              <IconButton 
                                size="small"
                                onClick={() => handleMessengerClick(student)}
                                sx={{ p: 0.5 }}
                              >
                                <MessageIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                            상세보기 →
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 활동 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                최근 활동
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '15%' }}>학생명</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '25%' }}>활동 내용</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '12%' }}>활동 유형</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '12%' }}>날짜</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '12%' }}>학습세션</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '12%' }}>과제명</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '12%' }}>결과</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.recentActivity.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {activity.studentName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {activity.activity}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: `${getActivityColor(activity.type)}.light`,
                            color: `${getActivityColor(activity.type)}.dark`
                          }}>
                            {getActivityIcon(activity.type)}
                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                              {activity.type === 'learning' ? '학습' : 
                               activity.type === 'evaluation' ? '평가' : '과제'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(activity.date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {activity.type === 'learning' ? '세션' : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 메신저 발송 다이얼로그 */}
      <Dialog 
        open={messengerDialog} 
        onClose={() => setMessengerDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getMessengerIcon(messengerType)}
            <Typography variant="h6">
              {selectedStudent?.studentName}님에게 메시지 보내기
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              학생 정보: {selectedStudent?.grade} | {selectedStudent?.phone}
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="메시지를 입력하세요..."
            variant="outlined"
          />
                     <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
             <Button
               variant={messengerType === 'whatsapp' ? 'contained' : 'outlined'}
               size="small"
               onClick={() => setMessengerType('whatsapp')}
               startIcon={<WhatsAppIcon />}
             >
               WhatsApp
             </Button>
             <Button
               variant={messengerType === 'kakao' ? 'contained' : 'outlined'}
               size="small"
               onClick={() => setMessengerType('kakao')}
               startIcon={<ChatIcon />}
               sx={{ 
                 bgcolor: messengerType === 'kakao' ? '#FEE500' : 'transparent',
                 color: messengerType === 'kakao' ? '#000' : 'inherit',
                 '&:hover': {
                   bgcolor: messengerType === 'kakao' ? '#FDD835' : 'transparent'
                 }
               }}
             >
               카카오톡
             </Button>
             <Button
               variant={messengerType === 'telegram' ? 'contained' : 'outlined'}
               size="small"
               onClick={() => setMessengerType('telegram')}
               startIcon={<TelegramIcon />}
             >
               Telegram
             </Button>
             <Button
               variant={messengerType === 'sms' ? 'contained' : 'outlined'}
               size="small"
               onClick={() => setMessengerType('sms')}
               startIcon={<MessageIcon />}
             >
               SMS
             </Button>
           </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessengerDialog(false)}>
            취소
          </Button>
          <Button 
            onClick={handleSendMessage}
            variant="contained"
            disabled={!messageText.trim()}
          >
            메시지 보내기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 