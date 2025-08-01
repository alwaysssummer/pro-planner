import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
  Avatar,
  Grid,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Grade as GradeIcon,
  Assignment as AssignmentIcon,
  Link as LinkIcon,
  ContentCopy as ContentCopyIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { saveStudents, loadStudents } from '../utils/storage';
import { taskService } from '../services/database';

interface Task {
  id: string;
  title: string;
  description: string;
  area: 'vocabulary' | 'phrase' | 'grammar' | 'logic';
  status: 'active' | 'completed' | 'pending';
  assignedStudents: string[];
  googleSheetLink?: string;
  vocabularyData?: Array<{ unit: string; english: string; meaning: string }>;
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
  startUnit?: string; // 시작 단원 (단어장 과제용)
  vocabularyData?: Array<{ unit: string; english: string; meaning: string }>; // 단어장 과제용 데이터
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
}

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(() => {
    // 로컬 스토리지에서 저장된 데이터 불러오기
    const savedStudents = loadStudents();
    if (savedStudents.length > 0) {
      // taskAssignments가 배열이 아닌 경우 안전하게 처리
      return savedStudents.map(student => ({
        ...student,
        taskAssignments: Array.isArray(student.taskAssignments) ? student.taskAssignments : [],
      }));
    }
    
    // 저장된 데이터가 없으면 기본 데이터 사용
    return [
      {
        id: '1',
        name: '김철수',
        address: '서울시 강남구 역삼동 123-45',
        phone: '010-1234-5678',
        grade: '중2',
        joinDate: '2023-09-01',
        status: 'active',
        assignedTasks: ['영어 문법 과제', '영어 회화 연습'],
        taskAssignments: [],
        grades: {
          '2024': {
            mockExam3: '85점',
            mockExam6: '92점',
            midterm1: '88점',
            final1: '90점',
          },
        },
      },
      {
        id: '2',
        name: '이영희',
        address: '서울시 서초구 서초동 456-78',
        phone: '010-2345-6789',
        grade: '고1',
        joinDate: '2023-10-15',
        status: 'active',
        assignedTasks: ['영어 문법 과제'],
        taskAssignments: [],
        grades: {
          '2024': {
            mockExam3: '78점',
            mockExam6: '85점',
            midterm1: '82점',
            final1: '87점',
          },
        },
      },
      {
        id: '3',
        name: '박민수',
        address: '서울시 마포구 합정동 789-12',
        phone: '010-3456-7890',
        grade: '고3',
        joinDate: '2023-08-20',
        status: 'active',
        assignedTasks: ['영어 문법 과제'],
        taskAssignments: [],
        grades: {
          '2024': {
            mockExam3: '95점',
            mockExam6: '98점',
            midterm1: '96점',
            final1: '97점',
          },
        },
      },
    ];
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // students가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    saveStudents(students);
  }, [students]);

  // Supabase에서 과제 데이터 불러오기
  useEffect(() => {
    loadTasksFromSupabase();
  }, []);

  const loadTasksFromSupabase = async () => {
    try {
      setTasksLoading(true);
      const tasksData = await taskService.getAll();
      console.log('로드된 과제 수:', tasksData.length);
      
      // 각 과제의 단어 데이터도 함께 불러오기
      const tasksWithVocabulary = await Promise.all(
        tasksData.map(async (task) => {
          if (task.area === 'vocabulary') {
            const vocabularyItems = await taskService.getVocabularyItems(task.id);
            console.log(`과제 "${task.title}" (ID: ${task.id})의 단어 수:`, vocabularyItems.length);
            
            // 단원 목록 확인
            const units = new Set(vocabularyItems.map(item => item.unit));
            const unitList = Array.from(units).sort((a, b) => {
              const aNum = parseInt(a);
              const bNum = parseInt(b);
              if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
              }
              return a.localeCompare(b, 'ko-KR', { numeric: true });
            });
            console.log(`과제 "${task.title}"의 단원 목록 (${unitList.length}개):`, unitList);
            
            return {
              ...task,
              vocabularyData: vocabularyItems.map(item => ({
                unit: item.unit,
                english: item.english,
                meaning: item.meaning
              }))
            };
          }
          return task;
        })
      );
      
      console.log('단어 데이터가 포함된 과제들:', tasksWithVocabulary);
      setTasks(tasksWithVocabulary);
    } catch (error) {
      console.error('과제 데이터 불러오기 실패:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  const [openDialog, setOpenDialog] = useState(false);
  const [openGradeDialog, setOpenGradeDialog] = useState(false);
  const [openAssignmentDialog, setOpenAssignmentDialog] = useState(false);
  const [openAssignmentDetailDialog, setOpenAssignmentDetailDialog] = useState(false);
  const [openAssignmentEditDialog, setOpenAssignmentEditDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [gradingStudent, setGradingStudent] = useState<Student | null>(null);
  const [assigningStudent, setAssigningStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<TaskAssignment | null>(null);
  const [editingAssignmentIndex, setEditingAssignmentIndex] = useState<number>(-1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedArea, setSelectedArea] = useState<'all' | 'vocabulary' | 'phrase' | 'grammar' | 'logic'>('all');
  const [weeklySchedule, setWeeklySchedule] = useState<{
    [day: string]: { isActive: boolean; dailyAmount: string };
  }>({});
  const [selectedStartUnit, setSelectedStartUnit] = useState<string>('');
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [openStudentDetailDialog, setOpenStudentDetailDialog] = useState(false);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editingDetailStudent, setEditingDetailStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    grade: '초6' as '초6' | '중1' | '중2' | '중3' | '고1' | '고2' | '고3',
  });

  const handleOpenDialog = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        address: student.address,
        phone: student.phone,
        grade: student.grade,
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        grade: '초6',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStudent(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      grade: '초6',
    });
  };

  const handleSubmit = () => {
    if (editingStudent) {
      // 편집 모드
      setStudents(students.map(student =>
        student.id === editingStudent.id
          ? { ...student, ...formData }
          : student
      ));
    } else {
      // 새 학생 추가
      const newStudent: Student = {
        id: Date.now().toString(),
        ...formData,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active',
        assignedTasks: [],
        taskAssignments: [],
        grades: {},
      };
      setStudents([...students, newStudent]);
    }
    handleCloseDialog();
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents(students.filter(student => student.id !== studentId));
  };

  const handleOpenGradeDialog = (student: Student) => {
    setGradingStudent(student);
    setOpenGradeDialog(true);
  };

  const handleCloseGradeDialog = () => {
    setOpenGradeDialog(false);
    setGradingStudent(null);
  };

  const handleSaveGrade = (studentId: string, gradeType: string, score: string) => {
    setStudents(students.map(student =>
      student.id === studentId
        ? {
            ...student,
            grades: {
              ...student.grades,
              [selectedYear]: {
                ...student.grades[selectedYear],
                [gradeType]: score,
              },
            },
          }
        : student
    ));
  };

  const handleOpenAssignmentDialog = (student: Student) => {
    setAssigningStudent(student);
    setSelectedArea('vocabulary');
    setWeeklySchedule({});
    setSelectedVocabularyTask(null);
    setVocabularyAnalysis(null);
    setOpenAssignmentDialog(true);
  };

  const handleCloseAssignmentDialog = () => {
    setOpenAssignmentDialog(false);
    setAssigningStudent(null);
    setSelectedArea('vocabulary');
    setWeeklySchedule({});
    setSelectedVocabularyTask(null);
    setVocabularyAnalysis(null);
  };

  const handleAssignTask = (taskId: string, taskTitle: string, area: 'vocabulary' | 'phrase' | 'grammar' | 'logic', weeklySchedule: any) => {
    if (!assigningStudent) return;

    // 해당 과제의 전체 데이터 가져오기
    const task = tasks.find((t: Task) => t.id === taskId);
    
    console.log('Assigning task:', { taskId, taskTitle, area });
    console.log('Found task:', task);
    console.log('Task vocabularyData:', task?.vocabularyData);

    // 단어장의 경우 선택된 단원부터 시작하는 로직
    let startUnit = '';
    let totalUnits = 0;
    
    if (area === 'vocabulary' && selectedVocabularyTask && vocabularyAnalysis) {
      startUnit = selectedStartUnit;
      totalUnits = vocabularyAnalysis.totalUnits;
      
      // 선택된 단원의 인덱스 찾기
      const startUnitIndex = vocabularyAnalysis.unitNames.indexOf(selectedStartUnit);
      if (startUnitIndex !== -1) {
        // 선택된 단원부터 남은 단원 수 계산
        totalUnits = vocabularyAnalysis.totalUnits - startUnitIndex;
      }
      
      console.log('Vocabulary assignment details:', {
        startUnit,
        startUnitIndex,
        totalUnits,
        unitNames: vocabularyAnalysis.unitNames
      });
    }

    const newAssignment: TaskAssignment = {
      taskId,
      taskTitle,
      area,
      weeklySchedule,
      startDate: calculateStartDate(weeklySchedule),
      status: 'active',
      progress: {
        completed: 0,
        total: area === 'vocabulary' ? totalUnits : 0,
      },
    };

    // 단어장의 경우 vocabularyData와 시작 단원 정보 추가
    if (area === 'vocabulary' && task && task.vocabularyData) {
      newAssignment.vocabularyData = task.vocabularyData;
      if (startUnit) {
        newAssignment.startUnit = startUnit;
      }
      
      console.log('Final assignment object:', newAssignment);
      console.log('Assignment has vocabularyData:', !!newAssignment.vocabularyData);
      console.log('VocabularyData length:', newAssignment.vocabularyData?.length);
    }

    setStudents(students.map(student =>
      student.id === assigningStudent.id
        ? {
            ...student,
            taskAssignments: Array.isArray(student.taskAssignments) 
              ? [...student.taskAssignments, newAssignment]
              : [newAssignment],
          }
        : student
    ));

    handleCloseAssignmentDialog();
  };

  const handleScheduleChange = (day: string, field: string, value: any) => {
    if (field === 'isActive') {
      setWeeklySchedule(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          isActive: value,
          dailyAmount: prev[day]?.dailyAmount || '',
        },
      }));
    } else if (field === 'dailyAmount') {
      setWeeklySchedule(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          isActive: prev[day]?.isActive || false,
          dailyAmount: value,
        },
      }));
    }
  };

  // 선택된 요일 수 계산 함수
  const getActiveDaysCount = () => {
    return Object.values(weeklySchedule).filter((day: any) => 
      day && typeof day === 'object' && day.isActive
    ).length;
  };

  // 오늘부터 시작하는 날짜 계산 함수
  const calculateStartDate = (weeklySchedule: { [day: string]: { isActive: boolean } }) => {
    const today = new Date();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const todayDayName = dayNames[today.getDay()];
    
    // 오늘이 학습 요일에 포함되어 있는지 확인
    if (weeklySchedule[todayDayName]?.isActive) {
      return today.toISOString().split('T')[0];
    }
    
    // 오늘이 학습 요일에 없으면 다음 학습 요일 찾기
    let nextDay = new Date(today);
    let daysChecked = 0;
    
    while (daysChecked < 7) {
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayName = dayNames[nextDay.getDay()];
      
      if (weeklySchedule[nextDayName]?.isActive) {
        return nextDay.toISOString().split('T')[0];
      }
      
      daysChecked++;
    }
    
    // 기본값으로 오늘 날짜 반환
    return today.toISOString().split('T')[0];
  };

  // 단어장 단원 분석 함수
  const analyzeVocabularyUnits = (task: Task) => {
    console.log('=== analyzeVocabularyUnits 시작 ===');
    console.log('과제:', task.title);
    console.log('영역:', task.area);
    console.log('vocabularyData 존재 여부:', !!task.vocabularyData);
    console.log('vocabularyData 길이:', task.vocabularyData?.length);
    
    if (task.area !== 'vocabulary' || !task.vocabularyData) {
      console.log('단어장이 아니거나 데이터가 없음');
      return null;
    }

    // 단원별로 그룹화
    const units = task.vocabularyData.reduce((acc, item) => {
      if (!acc[item.unit]) {
        acc[item.unit] = [];
      }
      acc[item.unit].push(item);
      return acc;
    }, {} as { [unit: string]: Array<{ unit: string; english: string; meaning: string }> });

    console.log('그룹화된 단원 수:', Object.keys(units).length);
    console.log('그룹화된 단원 목록 (정렬 전):', Object.keys(units));

    // 단원 이름을 정렬 (숫자 형태의 단원 이름도 올바르게 정렬)
    const unitNames = Object.keys(units).sort((a, b) => {
      // 숫자로 변환 가능한 경우 숫자로 비교
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      
      // 그 외의 경우 문자열로 비교
      return a.localeCompare(b, 'ko-KR', { numeric: true });
    });
    
    const totalUnits = unitNames.length;
    const totalWords = task.vocabularyData.length;

    console.log(`단어장 분석 완료: 총 ${totalUnits}개 단원, ${totalWords}개 단어`);
    console.log('단원 목록 (정렬 후):', unitNames);
    console.log('첫 번째 단원:', unitNames[0]);
    console.log('마지막 단원:', unitNames[unitNames.length - 1]);
    console.log('=== analyzeVocabularyUnits 종료 ===');

    return {
      totalUnits,
      totalWords,
      unitNames,
      units,
    };
  };

  // 선택된 단어장 정보
  const [selectedVocabularyTask, setSelectedVocabularyTask] = useState<Task | null>(null);
  const [vocabularyAnalysis, setVocabularyAnalysis] = useState<any>(null);

  // 단어장 선택 함수
  const handleSelectVocabularyTask = (task: Task) => {
    setSelectedVocabularyTask(task);
    const analysis = analyzeVocabularyUnits(task);
    setVocabularyAnalysis(analysis);
    if (analysis) {
      setAvailableUnits(analysis.unitNames);
      setSelectedStartUnit(analysis.unitNames[0] || ''); // 첫 번째 단원을 기본값으로 설정
    }
  };

  // 단어장 선택 해제 함수
  const handleDeselectVocabularyTask = () => {
    setSelectedVocabularyTask(null);
    setVocabularyAnalysis(null);
  };

  const handleOpenAssignmentDetailDialog = (student: Student) => {
    setViewingStudent(student);
    setOpenAssignmentDetailDialog(true);
  };

  const handleCloseAssignmentDetailDialog = () => {
    setOpenAssignmentDetailDialog(false);
    setViewingStudent(null);
  };

  const handleDeleteAssignment = (studentId: string, assignmentIndex: number) => {
    setStudents(students.map(student =>
      student.id === studentId
        ? {
            ...student,
            taskAssignments: student.taskAssignments.filter((_, index) => index !== assignmentIndex),
          }
        : student
    ));
  };

  const handleOpenAssignmentEditDialog = (assignment: TaskAssignment, index: number) => {
    setEditingAssignment(assignment);
    setEditingAssignmentIndex(index);
    setOpenAssignmentEditDialog(true);
  };

  const handleCloseAssignmentEditDialog = () => {
    setOpenAssignmentEditDialog(false);
    setEditingAssignment(null);
    setEditingAssignmentIndex(-1);
  };

  const handleUpdateAssignment = (updatedAssignment: TaskAssignment) => {
    if (!viewingStudent || editingAssignmentIndex === -1) return;

    const updatedStudents = students.map(student =>
      student.id === viewingStudent.id
        ? {
            ...student,
            taskAssignments: student.taskAssignments.map((assignment, index) =>
              index === editingAssignmentIndex ? updatedAssignment : assignment
            ),
          }
        : student
    );

    setStudents(updatedStudents);
    
    // viewingStudent도 업데이트하여 다이얼로그에 즉시 반영
    const updatedViewingStudent = updatedStudents.find(student => student.id === viewingStudent.id);
    if (updatedViewingStudent) {
      setViewingStudent(updatedViewingStudent);
    }

    handleCloseAssignmentEditDialog();
  };

  const handleCopyStudentLink = (studentId: string) => {
    const studentLink = `${window.location.origin}/student/${studentId}`;
    navigator.clipboard.writeText(studentLink).then(() => {
      alert('학생 페이지 링크가 클립보드에 복사되었습니다!');
    }).catch(() => {
      // 클립보드 접근이 실패한 경우 링크를 직접 표시
      prompt('학생 페이지 링크:', studentLink);
    });
  };

  const handleOpenStudentLink = (studentId: string) => {
    const studentLink = `${window.location.origin}/student/${studentId}`;
    window.open(studentLink, '_blank');
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

  const getGradeText = (grade: string) => {
    return grade;
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'error';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? '활성' : '비활성';
  };

  const handleOpenStudentDetailDialog = (student: Student) => {
    setDetailStudent(student);
    setEditingDetailStudent({ ...student });
    setIsEditingDetail(false);
    setOpenStudentDetailDialog(true);
  };

  const handleCloseStudentDetailDialog = () => {
    setOpenStudentDetailDialog(false);
    setDetailStudent(null);
    setEditingDetailStudent(null);
    setIsEditingDetail(false);
  };

  const handleSaveDetailStudent = () => {
    if (editingDetailStudent) {
      setStudents(students.map(student =>
        student.id === editingDetailStudent.id
          ? editingDetailStudent
          : student
      ));
      setDetailStudent(editingDetailStudent);
      setIsEditingDetail(false);
    }
  };

  const handleCancelEditDetail = () => {
    setEditingDetailStudent(detailStudent ? { ...detailStudent } : null);
    setIsEditingDetail(false);
  };

  const handleDetailFieldChange = (field: keyof Student, value: any) => {
    if (editingDetailStudent) {
      setEditingDetailStudent({
        ...editingDetailStudent,
        [field]: value
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          학생 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          새 학생 추가
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>학생</TableCell>
                  <TableCell>주소</TableCell>
                  <TableCell>연락처</TableCell>
                  <TableCell>학년</TableCell>
                  <TableCell>가입일</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>배정된 과제</TableCell>
                  <TableCell>과제 배정</TableCell>
                  <TableCell>성적</TableCell>
                  <TableCell>링크</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          cursor: 'pointer',
                          '&:hover': {
                            color: 'primary.main',
                          }
                        }}
                        onClick={() => handleOpenStudentDetailDialog(student)}
                      >
                        <Avatar sx={{ mr: 2 }}>
                          {student.name.charAt(0)}
                        </Avatar>
                        <Typography sx={{ fontWeight: 500 }}>
                          {student.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{student.address}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>
                      <Chip
                        label={getGradeText(student.grade)}
                        color={getGradeColor(student.grade) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{student.joinDate}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(student.status)}
                        color={getStatusColor(student.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {student.assignedTasks.length > 0 ? (
                        <Box>
                          {student.assignedTasks.slice(0, 2).join(', ')}
                          {student.assignedTasks.length > 2 && ` 외 ${student.assignedTasks.length - 2}개`}
                        </Box>
                      ) : (
                        '배정된 과제 없음'
                      )}
                    </TableCell>
                    <TableCell>
                      {student.taskAssignments && student.taskAssignments.length > 0 ? (
                        <Chip
                          label={`${student.taskAssignments.length}개 과제`}
                          color="success"
                          size="small"
                          onClick={() => handleOpenAssignmentDetailDialog(student)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <Chip
                          label="배정 없음"
                          color="default"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {student.grades && Object.keys(student.grades).length > 0 ? (
                        <Chip
                          label={`${Object.keys(student.grades).length}년도 성적`}
                          color="info"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="성적 없음"
                          color="default"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenStudentLink(student.id)}
                        color="primary"
                        title="학생 페이지 새창으로 열기"
                      >
                        <OpenInNewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyStudentLink(student.id)}
                        color="primary"
                        title="학생 페이지 링크 복사"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(student)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenGradeDialog(student)}
                        color="info"
                      >
                        <GradeIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenAssignmentDialog(student)}
                        color="success"
                      >
                        <AssignmentIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteStudent(student.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStudent ? '학생 정보 편집' : '새 학생 추가'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="이름"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="주소"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="연락처"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="학년"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value as any })}
              SelectProps={{
                native: true,
              }}
            >
              <option value="초6">초등학교 6학년</option>
              <option value="중1">중학교 1학년</option>
              <option value="중2">중학교 2학년</option>
              <option value="중3">중학교 3학년</option>
              <option value="고1">고등학교 1학년</option>
              <option value="고2">고등학교 2학년</option>
              <option value="고3">고등학교 3학년</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingStudent ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 성적 관리 다이얼로그 */}
      <Dialog open={openGradeDialog} onClose={handleCloseGradeDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {gradingStudent?.name} - 성적 관리
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* 연도 선택 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                연도 선택
              </Typography>
              <TextField
                select
                label="연도"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year.toString()}>
                    {year}년
                  </option>
                ))}
              </TextField>
            </Box>

            <Typography variant="h6" sx={{ mb: 2 }}>
              {selectedYear}년 모의고사 성적
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="3월 모의고사"
                  value={gradingStudent?.grades?.[selectedYear]?.mockExam3 || ''}
                  onChange={(e) => {
                    if (gradingStudent) {
                      handleSaveGrade(gradingStudent.id, 'mockExam3', e.target.value);
                    }
                  }}
                  placeholder="예: 85점, A등급"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="6월 모의고사"
                  value={gradingStudent?.grades?.[selectedYear]?.mockExam6 || ''}
                  onChange={(e) => {
                    if (gradingStudent) {
                      handleSaveGrade(gradingStudent.id, 'mockExam6', e.target.value);
                    }
                  }}
                  placeholder="예: 92점, A등급"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="9월 모의고사"
                  value={gradingStudent?.grades?.[selectedYear]?.mockExam9 || ''}
                  onChange={(e) => {
                    if (gradingStudent) {
                      handleSaveGrade(gradingStudent.id, 'mockExam9', e.target.value);
                    }
                  }}
                  placeholder="예: 88점, A등급"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="11월 모의고사"
                  value={gradingStudent?.grades?.[selectedYear]?.mockExam11 || ''}
                  onChange={(e) => {
                    if (gradingStudent) {
                      handleSaveGrade(gradingStudent.id, 'mockExam11', e.target.value);
                    }
                  }}
                  placeholder="예: 95점, A등급"
                />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mb: 2 }}>
              {selectedYear}년 학기별 성적
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="1학기 중간고사"
                  value={gradingStudent?.grades?.[selectedYear]?.midterm1 || ''}
                  onChange={(e) => {
                    if (gradingStudent) {
                      handleSaveGrade(gradingStudent.id, 'midterm1', e.target.value);
                    }
                  }}
                  placeholder="예: 88점, A등급"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="1학기 기말고사"
                  value={gradingStudent?.grades?.[selectedYear]?.final1 || ''}
                  onChange={(e) => {
                    if (gradingStudent) {
                      handleSaveGrade(gradingStudent.id, 'final1', e.target.value);
                    }
                  }}
                  placeholder="예: 90점, A등급"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="2학기 중간고사"
                  value={gradingStudent?.grades?.[selectedYear]?.midterm2 || ''}
                  onChange={(e) => {
                    if (gradingStudent) {
                      handleSaveGrade(gradingStudent.id, 'midterm2', e.target.value);
                    }
                  }}
                  placeholder="예: 87점, A등급"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="2학기 기말고사"
                  value={gradingStudent?.grades?.[selectedYear]?.final2 || ''}
                  onChange={(e) => {
                    if (gradingStudent) {
                      handleSaveGrade(gradingStudent.id, 'final2', e.target.value);
                    }
                  }}
                  placeholder="예: 93점, A등급"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGradeDialog}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 과제 배정 다이얼로그 */}
      <Dialog open={openAssignmentDialog} onClose={handleCloseAssignmentDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {assigningStudent?.name} - 과제 배정
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              배정 가능한 과제 목록
            </Typography>
            
            {/* 영역별 탭 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={selectedArea} onChange={(e, newValue) => setSelectedArea(newValue)}>
                <Tab label="전체" value="all" />
                <Tab label="단어" value="vocabulary" />
                <Tab label="구문" value="phrase" />
                <Tab label="어법" value="grammar" />
                <Tab label="논리" value="logic" />
              </Tabs>
            </Box>

            {/* 단어 영역일 때 단어장 선택 및 분석 */}
            {selectedArea === 'vocabulary' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  단어장 선택
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={loadTasksFromSupabase}
                    disabled={tasksLoading}
                  >
                    {tasksLoading ? '로딩 중...' : '새로고침'}
                  </Button>
                </Typography>
                
                {/* 단어장 목록 */}
                {tasksLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {tasks
                    .filter((task: Task) => task.area === 'vocabulary' && task.vocabularyData)
                    .map((task: Task) => {
                      const analysis = analyzeVocabularyUnits(task);
                      return (
                        <Grid item xs={12} md={4} key={task.id}>
                          <Card 
                            sx={{ 
                              cursor: 'pointer',
                              border: selectedVocabularyTask?.id === task.id ? 2 : 1,
                              borderColor: selectedVocabularyTask?.id === task.id ? 'primary.main' : 'divider'
                            }}
                            onClick={() => handleSelectVocabularyTask(task)}
                          >
                            <CardContent>
                              <Typography variant="h6" sx={{ mb: 1 }}>
                                {task.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {task.description}
                              </Typography>
                              {analysis && (
                                <Box>
                                  <Typography variant="body2" color="primary">
                                    총 {analysis.totalUnits}단원, {analysis.totalWords}개 단어
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    단원: {analysis.unitNames.slice(0, 3).join(', ')}
                                    {analysis.unitNames.length > 3 && '...'}
                                  </Typography>
                                  <Chip
                                    label={task.status === 'active' ? '활성' : task.status === 'pending' ? '대기' : '완료'}
                                    color={task.status === 'active' ? 'success' : task.status === 'pending' ? 'warning' : 'default'}
                                    size="small"
                                    sx={{ mt: 1 }}
                                  />
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                </Grid>
                )}

                {/* 선택된 단어장 분석 정보 */}
                {selectedVocabularyTask && vocabularyAnalysis && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {selectedVocabularyTask.title} - 단원 분석
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          전체 정보
                        </Typography>
                        <Typography variant="body2">
                          • 총 단원 수: {vocabularyAnalysis.totalUnits}단원
                        </Typography>
                        <Typography variant="body2">
                          • 총 단어 수: {vocabularyAnalysis.totalWords}개
                        </Typography>
                        <Typography variant="body2">
                          • 평균 단원당: {Math.round(vocabularyAnalysis.totalWords / vocabularyAnalysis.totalUnits)}개 단어
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          시작 단원 선택
                        </Typography>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>시작 단원</InputLabel>
                          <Select
                            value={selectedStartUnit}
                            onChange={(e) => setSelectedStartUnit(e.target.value)}
                            label="시작 단원"
                          >
                            {vocabularyAnalysis.unitNames.map((unitName: string) => (
                              <MenuItem key={unitName} value={unitName}>
                                {unitName} ({vocabularyAnalysis.units[unitName].length}개 단어)
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          단원별 단어 수
                        </Typography>
                        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                          {vocabularyAnalysis.unitNames.map((unitName: string) => (
                            <Typography key={unitName} variant="body2">
                              • {unitName}: {vocabularyAnalysis.units[unitName].length}개 단어
                            </Typography>
                          ))}
                        </Box>
                      </Grid>
                    </Grid>

                    <Button
                      variant="outlined"
                      onClick={handleDeselectVocabularyTask}
                      sx={{ mt: 2 }}
                    >
                      단어장 선택 해제
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {/* 과제 목록 - 단어 영역이 아닐 때만 표시 */}
            {selectedArea !== 'vocabulary' && (
              <Grid container spacing={2}>
                {tasks
                  .filter((task: Task) => selectedArea === 'all' || (task.area === selectedArea && task.status === 'active'))
                  .map((task: Task) => (
                    <Grid item xs={12} md={6} key={task.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            {task.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {task.description}
                          </Typography>

                          {/* 요일별 학습 스케줄 설정 */}
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            요일별 학습 스케줄
                          </Typography>
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                              <Grid item xs={12} sm={6} md={3} key={day}>
                                <Card variant="outlined">
                                  <CardContent sx={{ p: 2 }}>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={weeklySchedule[day]?.isActive || false}
                                          onChange={(e) => handleScheduleChange(day, 'isActive', e.target.checked)}
                                        />
                                      }
                                      label={day}
                                      sx={{ mb: 1 }}
                                    />
                                    {weeklySchedule[day]?.isActive && (
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label={`${day} 학습량`}
                                        value={weeklySchedule[day]?.dailyAmount || ''}
                                        onChange={(e) => handleScheduleChange(day, 'dailyAmount', e.target.value)}
                                        placeholder={
                                          task.area === 'phrase' 
                                            ? "예: 3문제" 
                                            : "예: 5문제"
                                        }
                                        sx={{ mt: 1 }}
                                      />
                                    )}
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>

                          <Button
                            variant="contained"
                            fullWidth
                            onClick={() => handleAssignTask(task.id, task.title, task.area, weeklySchedule)}
                          >
                            과제 배정
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            )}

            {/* 단어 영역일 때 선택된 단어장 배정 */}
            {selectedArea === 'vocabulary' && selectedVocabularyTask && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {selectedVocabularyTask.title} - 배정 설정
                </Typography>
                
                {/* 주간 스케줄 설정 */}
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  요일별 학습 스케줄
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                    <Grid item xs={12} sm={6} md={3} key={day}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={weeklySchedule[day]?.isActive || false}
                                onChange={(e) => handleScheduleChange(day, 'isActive', e.target.checked)}
                              />
                            }
                            label={day}
                            sx={{ mb: 1 }}
                          />
                          {weeklySchedule[day]?.isActive && (
                            <TextField
                              fullWidth
                              size="small"
                              label={`${day} 단원 수`}
                              value={weeklySchedule[day]?.dailyAmount || ''}
                              onChange={(e) => handleScheduleChange(day, 'dailyAmount', e.target.value)}
                              placeholder="예: 2단원"
                              sx={{ mt: 1 }}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* 선택된 단원 정보 */}
                {selectedStartUnit && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="success.main">
                      시작 단원 정보
                    </Typography>
                    <Typography variant="body2">
                      • 시작 단원: {selectedStartUnit}
                    </Typography>
                    <Typography variant="body2">
                      • 시작 단원부터 남은 단원: {vocabularyAnalysis ? vocabularyAnalysis.unitNames.indexOf(selectedStartUnit) !== -1 ? vocabularyAnalysis.totalUnits - vocabularyAnalysis.unitNames.indexOf(selectedStartUnit) : vocabularyAnalysis.totalUnits : 0}단원
                    </Typography>
                  </Box>
                )}

                {/* 예상 완료 기간 계산 */}
                {vocabularyAnalysis && selectedStartUnit && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="info.main">
                      예상 완료 기간
                    </Typography>
                    <Typography variant="body2">
                      • 시작 단원부터 남은 단원: {vocabularyAnalysis.totalUnits - vocabularyAnalysis.unitNames.indexOf(selectedStartUnit)}단원
                    </Typography>
                    <Typography variant="body2">
                      • 선택된 요일별 단원 수:
                    </Typography>
                    {Object.entries(weeklySchedule).map(([day, schedule]) => {
                      const scheduleData = schedule as { isActive: boolean; dailyAmount: string };
                      return scheduleData.isActive && scheduleData.dailyAmount ? (
                        <Typography key={day} variant="body2" sx={{ ml: 2 }}>
                          • {day}: {scheduleData.dailyAmount}단원
                        </Typography>
                      ) : null;
                    })}
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      • 선택된 요일 수: {getActiveDaysCount()}일
                    </Typography>
                  </Box>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleAssignTask(selectedVocabularyTask.id, selectedVocabularyTask.title, selectedVocabularyTask.area, weeklySchedule)}
                >
                  단어장 배정
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignmentDialog}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 과제 상세 보기 다이얼로그 */}
      <Dialog open={openAssignmentDetailDialog} onClose={handleCloseAssignmentDetailDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {viewingStudent?.name} - 배정된 과제 관리
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* 영역별 필터링 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                영역별 필터
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['all', 'vocabulary', 'phrase', 'grammar', 'logic'].map((area) => (
                  <Chip
                    key={area}
                    label={area === 'all' ? '전체' : 
                           area === 'vocabulary' ? '단어' :
                           area === 'phrase' ? '구문' :
                           area === 'grammar' ? '어법' : '논리'}
                    color={selectedArea === area ? 'primary' : 'default'}
                    onClick={() => setSelectedArea(area as 'all' | 'vocabulary' | 'phrase' | 'grammar' | 'logic')}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>

            {viewingStudent && viewingStudent.taskAssignments && viewingStudent.taskAssignments.length > 0 ? (
              <Grid container spacing={2}>
                {viewingStudent.taskAssignments
                  .filter(assignment => selectedArea === 'all' || assignment.area === selectedArea)
                  .map((assignment, index) => (
                  <Grid item xs={12} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          {assignment.taskTitle}
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                              기본 정보
                            </Typography>
                            <Typography variant="body2">
                              • 영역: {assignment.area === 'vocabulary' ? '단어' : 
                                       assignment.area === 'phrase' ? '구문' : 
                                       assignment.area === 'grammar' ? '어법' : '논리'}
                            </Typography>
                            <Typography variant="body2">
                              • 상태: {assignment.status === 'active' ? '진행중' : 
                                       assignment.status === 'completed' ? '완료' : '일시정지'}
                            </Typography>
                            <Typography variant="body2">
                              • 시작일: {assignment.startDate}
                            </Typography>
                            {assignment.endDate && (
                              <Typography variant="body2">
                                • 종료일: {assignment.endDate}
                              </Typography>
                            )}
                            <Typography variant="body2">
                              • 진행률: {assignment.progress.completed}/{assignment.progress.total}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                              요일별 스케줄
                            </Typography>
                            {Object.entries(assignment.weeklySchedule).map(([day, schedule]) => 
                              schedule.isActive && (
                                <Typography key={day} variant="body2">
                                  • {day}: {schedule.dailyAmount}
                                </Typography>
                              )
                            )}
                          </Grid>
                        </Grid>

                        {/* 단어장의 경우 시작 단원 정보 표시 */}
                        {assignment.area === 'vocabulary' && assignment.startUnit && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="success.main">
                              단어장 정보
                            </Typography>
                            <Typography variant="body2">
                              • 시작 단원: {assignment.startUnit}
                            </Typography>
                          </Box>
                        )}

                        {/* 관리 버튼 */}
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => handleOpenAssignmentEditDialog(assignment, index)}
                          >
                            수정
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleDeleteAssignment(viewingStudent!.id, index)}
                          >
                            삭제
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                배정된 과제가 없습니다.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignmentDetailDialog}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 과제 수정 다이얼로그 */}
      <Dialog open={openAssignmentEditDialog} onClose={handleCloseAssignmentEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          과제 수정
        </DialogTitle>
        <DialogContent>
          {editingAssignment && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {editingAssignment.taskTitle}
              </Typography>
              
              {/* 상태 변경 */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>상태</InputLabel>
                <Select
                  value={editingAssignment.status}
                  onChange={(e) => setEditingAssignment({
                    ...editingAssignment,
                    status: e.target.value as 'active' | 'completed' | 'paused'
                  })}
                  label="상태"
                >
                  <MenuItem value="active">진행중</MenuItem>
                  <MenuItem value="completed">완료</MenuItem>
                  <MenuItem value="paused">일시정지</MenuItem>
                </Select>
              </FormControl>

              {/* 진행률 표시 및 수정 */}
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  진행률
                </Typography>
                <Typography variant="body1">
                  {editingAssignment.progress.completed} / {editingAssignment.progress.total} 완료
                </Typography>
                <Box sx={{ mt: 1, width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                  <Box 
                    sx={{ 
                      width: `${(editingAssignment.progress.completed / editingAssignment.progress.total) * 100}%`,
                      bgcolor: 'primary.main',
                      height: '100%',
                      borderRadius: 1,
                      transition: 'width 0.3s'
                    }} 
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  진행률: {Math.round((editingAssignment.progress.completed / editingAssignment.progress.total) * 100)}%
                </Typography>
                
                {/* 진행률 수동 조정 */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="완료된 과제"
                      type="number"
                      value={editingAssignment.progress.completed}
                      onChange={(e) => setEditingAssignment({
                        ...editingAssignment,
                        progress: {
                          ...editingAssignment.progress,
                          completed: Math.max(0, Math.min(parseInt(e.target.value) || 0, editingAssignment.progress.total))
                        }
                      })}
                      inputProps={{ min: 0, max: editingAssignment.progress.total }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="전체 과제"
                      type="number"
                      value={editingAssignment.progress.total}
                      onChange={(e) => setEditingAssignment({
                        ...editingAssignment,
                        progress: {
                          ...editingAssignment.progress,
                          total: Math.max(1, parseInt(e.target.value) || 1),
                          completed: Math.min(editingAssignment.progress.completed, Math.max(1, parseInt(e.target.value) || 1))
                        }
                      })}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* 시작 단원 수정 (단어장 과제인 경우) */}
              {editingAssignment.area === 'vocabulary' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    시작 단원 수정
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>시작 단원</InputLabel>
                    <Select
                      value={editingAssignment.startUnit || ''}
                      onChange={(e) => setEditingAssignment({
                        ...editingAssignment,
                        startUnit: e.target.value
                      })}
                      label="시작 단원"
                    >
                      {tasks
                        .find(task => task.id === editingAssignment.taskId)
                        ?.vocabularyData
                        ?.map((item: { unit: string; english: string; meaning: string }) => item.unit)
                        .filter((unit: string, index: number, arr: string[]) => arr.indexOf(unit) === index)
                        .sort((a: string, b: string) => {
                          // 숫자로 변환 가능한 경우 숫자로 비교
                          const aNum = parseInt(a);
                          const bNum = parseInt(b);
                          
                          if (!isNaN(aNum) && !isNaN(bNum)) {
                            return aNum - bNum;
                          }
                          
                          // 그 외의 경우 문자열로 비교
                          return a.localeCompare(b, 'ko-KR', { numeric: true });
                        })
                        .map((unit: string) => (
                          <MenuItem key={unit} value={unit}>
                            {unit}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* 요일별 스케줄 수정 */}
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                요일별 스케줄 수정
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                  <Grid item xs={12} sm={6} md={3} key={day}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingAssignment.weeklySchedule[day]?.isActive || false}
                              onChange={(e) => setEditingAssignment({
                                ...editingAssignment,
                                weeklySchedule: {
                                  ...editingAssignment.weeklySchedule,
                                  [day]: {
                                    ...editingAssignment.weeklySchedule[day],
                                    isActive: e.target.checked,
                                    dailyAmount: editingAssignment.weeklySchedule[day]?.dailyAmount || ''
                                  }
                                }
                              })}
                            />
                          }
                          label={day}
                          sx={{ mb: 1 }}
                        />
                        {editingAssignment.weeklySchedule[day]?.isActive && (
                          <TextField
                            fullWidth
                            size="small"
                            label={`${day} 학습량`}
                            value={editingAssignment.weeklySchedule[day]?.dailyAmount || ''}
                            onChange={(e) => setEditingAssignment({
                              ...editingAssignment,
                              weeklySchedule: {
                                ...editingAssignment.weeklySchedule,
                                [day]: {
                                  ...editingAssignment.weeklySchedule[day],
                                  isActive: true,
                                  dailyAmount: e.target.value
                                }
                              }
                            })}
                            placeholder={
                              editingAssignment.area === 'vocabulary' ? "예: 2단원" :
                              editingAssignment.area === 'phrase' ? "예: 3문제" :
                              "예: 5문제"
                            }
                            sx={{ mt: 1 }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignmentEditDialog}>취소</Button>
          <Button 
            variant="contained" 
            onClick={() => editingAssignment && handleUpdateAssignment(editingAssignment)}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 학생 상세 정보 다이얼로그 */}
      <Dialog open={openStudentDetailDialog} onClose={handleCloseStudentDetailDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5">
              {detailStudent?.name} - 상세 정보
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={detailStudent ? getStatusText(detailStudent.status) : ''}
                color={detailStudent ? getStatusColor(detailStudent.status) as any : 'default'}
                size="small"
              />
              {!isEditingDetail ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setIsEditingDetail(true)}
                  startIcon={<EditIcon />}
                >
                  편집
                </Button>
              ) : (
                <>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSaveDetailStudent}
                  >
                    저장
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleCancelEditDetail}
                  >
                    취소
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {editingDetailStudent && (
            <Box sx={{ pt: 2 }}>
              {/* 기본 정보 섹션 */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    기본 정보
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">이름</Typography>
                      {isEditingDetail ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={editingDetailStudent.name}
                          onChange={(e) => handleDetailFieldChange('name', e.target.value)}
                          sx={{ mb: 2 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mb: 2 }}>{editingDetailStudent.name}</Typography>
                      )}
                      
                      <Typography variant="subtitle2" color="text.secondary">주소</Typography>
                      {isEditingDetail ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={editingDetailStudent.address}
                          onChange={(e) => handleDetailFieldChange('address', e.target.value)}
                          sx={{ mb: 2 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mb: 2 }}>{editingDetailStudent.address}</Typography>
                      )}
                      
                      <Typography variant="subtitle2" color="text.secondary">연락처</Typography>
                      {isEditingDetail ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={editingDetailStudent.phone}
                          onChange={(e) => handleDetailFieldChange('phone', e.target.value)}
                          sx={{ mb: 2 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mb: 2 }}>{editingDetailStudent.phone}</Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">학년</Typography>
                      {isEditingDetail ? (
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                          <Select
                            value={editingDetailStudent.grade}
                            onChange={(e) => handleDetailFieldChange('grade', e.target.value)}
                          >
                            <MenuItem value="초6">초등학교 6학년</MenuItem>
                            <MenuItem value="중1">중학교 1학년</MenuItem>
                            <MenuItem value="중2">중학교 2학년</MenuItem>
                            <MenuItem value="중3">중학교 3학년</MenuItem>
                            <MenuItem value="고1">고등학교 1학년</MenuItem>
                            <MenuItem value="고2">고등학교 2학년</MenuItem>
                            <MenuItem value="고3">고등학교 3학년</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={getGradeText(editingDetailStudent.grade)}
                            color={getGradeColor(editingDetailStudent.grade) as any}
                            size="small"
                          />
                        </Box>
                      )}
                      
                      <Typography variant="subtitle2" color="text.secondary">가입일</Typography>
                      {isEditingDetail ? (
                        <TextField
                          fullWidth
                          size="small"
                          type="date"
                          value={editingDetailStudent.joinDate}
                          onChange={(e) => handleDetailFieldChange('joinDate', e.target.value)}
                          sx={{ mb: 2 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mb: 2 }}>{editingDetailStudent.joinDate}</Typography>
                      )}
                      
                      <Typography variant="subtitle2" color="text.secondary">상태</Typography>
                      {isEditingDetail ? (
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                          <Select
                            value={editingDetailStudent.status}
                            onChange={(e) => handleDetailFieldChange('status', e.target.value)}
                          >
                            <MenuItem value="active">활성</MenuItem>
                            <MenuItem value="inactive">비활성</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={getStatusText(editingDetailStudent.status)}
                            color={getStatusColor(editingDetailStudent.status) as any}
                            size="small"
                          />
                        </Box>
                      )}
                      
                      <Typography variant="subtitle2" color="text.secondary">학생 페이지 링크</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1, flex: 1 }}>
                          {window.location.origin}/student/{editingDetailStudent.id}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenStudentLink(editingDetailStudent.id)}
                          color="primary"
                          title="학생 페이지 새창으로 열기"
                        >
                          <OpenInNewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyStudentLink(editingDetailStudent.id)}
                          color="primary"
                          title="학생 페이지 링크 복사"
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* 과제 진행 상황 섹션 */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    과제 진행 상황
                  </Typography>
                  
                  {editingDetailStudent.taskAssignments && editingDetailStudent.taskAssignments.length > 0 ? (
                    <>
                      {/* 전체 진행률 요약 */}
                      <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">전체 과제 수</Typography>
                            <Typography variant="h6">{editingDetailStudent.taskAssignments.length}개</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">진행중</Typography>
                            <Typography variant="h6" color="success.main">
                              {editingDetailStudent.taskAssignments.filter(a => a.status === 'active').length}개
                            </Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">완료</Typography>
                            <Typography variant="h6" color="info.main">
                              {editingDetailStudent.taskAssignments.filter(a => a.status === 'completed').length}개
                            </Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">일시정지</Typography>
                            <Typography variant="h6" color="warning.main">
                              {editingDetailStudent.taskAssignments.filter(a => a.status === 'paused').length}개
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* 개별 과제 목록 */}
                      <Grid container spacing={2}>
                        {editingDetailStudent.taskAssignments.map((assignment, index) => (
                          <Grid item xs={12} key={index}>
                            <Card variant="outlined">
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                  <Box>
                                    <Typography variant="h6">
                                      {assignment.taskTitle}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                      <Chip
                                        label={assignment.area === 'vocabulary' ? '단어' : 
                                               assignment.area === 'phrase' ? '구문' : 
                                               assignment.area === 'grammar' ? '어법' : '논리'}
                                        color="primary"
                                        size="small"
                                      />
                                      <Chip
                                        label={assignment.status === 'active' ? '진행중' : 
                                               assignment.status === 'completed' ? '완료' : '일시정지'}
                                        color={assignment.status === 'active' ? 'success' : 
                                               assignment.status === 'completed' ? 'info' : 'warning'}
                                        size="small"
                                      />
                                    </Box>
                                  </Box>
                                  <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" color="text.secondary">
                                      시작일: {assignment.startDate}
                                    </Typography>
                                    {assignment.endDate && (
                                      <Typography variant="body2" color="text.secondary">
                                        종료일: {assignment.endDate}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>

                                {/* 진행률 표시 */}
                                <Box sx={{ mb: 2 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">진행률</Typography>
                                    <Typography variant="body2" color="primary">
                                      {assignment.progress.completed} / {assignment.progress.total} 
                                      ({Math.round((assignment.progress.completed / assignment.progress.total) * 100)}%)
                                    </Typography>
                                  </Box>
                                  <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                                    <Box 
                                      sx={{ 
                                        width: `${(assignment.progress.completed / assignment.progress.total) * 100}%`,
                                        bgcolor: 'primary.main',
                                        height: '100%',
                                        borderRadius: 1,
                                        transition: 'width 0.3s'
                                      }} 
                                    />
                                  </Box>
                                </Box>

                                {/* 요일별 스케줄 */}
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1 }}>요일별 스케줄</Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {Object.entries(assignment.weeklySchedule).map(([day, schedule]) => 
                                      schedule.isActive && (
                                        <Chip
                                          key={day}
                                          label={`${day}: ${schedule.dailyAmount}`}
                                          size="small"
                                          variant="outlined"
                                        />
                                      )
                                    )}
                                  </Box>
                                </Box>

                                {/* 단어장 정보 */}
                                {assignment.area === 'vocabulary' && assignment.startUnit && (
                                  <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" color="success.main">
                                      시작 단원: {assignment.startUnit}
                                    </Typography>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      배정된 과제가 없습니다.
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* 성적 정보 섹션 */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    성적 정보
                  </Typography>
                  
                  {editingDetailStudent.grades && Object.keys(editingDetailStudent.grades).length > 0 ? (
                    <Box>
                      {Object.entries(editingDetailStudent.grades).map(([year, grades]) => (
                        <Box key={year} sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                            {year}년
                          </Typography>
                          
                          {/* 모의고사 성적 */}
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>모의고사</Typography>
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            {grades.mockExam3 && (
                              <Grid item xs={6} md={3}>
                                <Card variant="outlined">
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography variant="caption" color="text.secondary">3월</Typography>
                                    <Typography variant="body1">{grades.mockExam3}</Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            )}
                            {grades.mockExam6 && (
                              <Grid item xs={6} md={3}>
                                <Card variant="outlined">
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography variant="caption" color="text.secondary">6월</Typography>
                                    <Typography variant="body1">{grades.mockExam6}</Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            )}
                            {grades.mockExam9 && (
                              <Grid item xs={6} md={3}>
                                <Card variant="outlined">
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography variant="caption" color="text.secondary">9월</Typography>
                                    <Typography variant="body1">{grades.mockExam9}</Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            )}
                            {grades.mockExam11 && (
                              <Grid item xs={6} md={3}>
                                <Card variant="outlined">
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography variant="caption" color="text.secondary">11월</Typography>
                                    <Typography variant="body1">{grades.mockExam11}</Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            )}
                          </Grid>
                          
                          {/* 학기별 성적 */}
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>학기별 성적</Typography>
                          <Grid container spacing={2}>
                            {grades.midterm1 && (
                              <Grid item xs={6} md={3}>
                                <Card variant="outlined">
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography variant="caption" color="text.secondary">1학기 중간</Typography>
                                    <Typography variant="body1">{grades.midterm1}</Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            )}
                            {grades.final1 && (
                              <Grid item xs={6} md={3}>
                                <Card variant="outlined">
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography variant="caption" color="text.secondary">1학기 기말</Typography>
                                    <Typography variant="body1">{grades.final1}</Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            )}
                            {grades.midterm2 && (
                              <Grid item xs={6} md={3}>
                                <Card variant="outlined">
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography variant="caption" color="text.secondary">2학기 중간</Typography>
                                    <Typography variant="body1">{grades.midterm2}</Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            )}
                            {grades.final2 && (
                              <Grid item xs={6} md={3}>
                                <Card variant="outlined">
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography variant="caption" color="text.secondary">2학기 기말</Typography>
                                    <Typography variant="body1">{grades.final2}</Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      등록된 성적이 없습니다.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStudentDetailDialog}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentManagement; 