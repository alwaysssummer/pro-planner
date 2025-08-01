// 로컬 스토리지를 사용한 데이터 저장/불러오기 유틸리티

const STORAGE_KEYS = {
  TASKS: 'pro_planner_tasks',
  STUDENTS: 'pro_planner_students',
} as const;

// 데이터 저장
export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('데이터 저장 실패:', error);
  }
};

// 데이터 불러오기
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('데이터 불러오기 실패:', error);
    return defaultValue;
  }
};

// 과제 데이터 저장
export const saveTasks = (tasks: any[]): void => {
  saveToStorage(STORAGE_KEYS.TASKS, tasks);
};

// 과제 데이터 불러오기
export const loadTasks = (): any[] => {
  return loadFromStorage(STORAGE_KEYS.TASKS, []);
};

// 학생 데이터 저장
export const saveStudents = (students: any[]): void => {
  saveToStorage(STORAGE_KEYS.STUDENTS, students);
};

// 학생 데이터 불러오기
export const loadStudents = (): any[] => {
  return loadFromStorage(STORAGE_KEYS.STUDENTS, []);
}; 