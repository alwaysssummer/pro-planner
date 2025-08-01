export interface VocabularyWord {
  id: string;
  english: string;
  korean: string;
  pronunciation?: string; // 발음기호 추가
  unit: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
}

export interface VocabularyUnit {
  id: string;
  name: string;
  words: VocabularyWord[];
  totalWords: number;
}

export interface VocabularyBook {
  id: string;
  name: string;
  units: VocabularyUnit[];
  totalUnits: number;
}

// 더미 단어장 데이터 (실제로는 API에서 가져올 예정)
export const vocabularyBooks: VocabularyBook[] = [
  {
    id: 'book1',
    name: '기본 단어장 1',
    totalUnits: 10,
    units: [
      {
        id: 'unit1',
        name: 'Unit 1 - 기본 동사',
        totalWords: 5,
        words: [
          { id: '1', english: 'run', korean: '달리다', pronunciation: '/rʌn/', unit: 'unit1' },
          { id: '2', english: 'walk', korean: '걷다', pronunciation: '/wɔːk/', unit: 'unit1' },
          { id: '3', english: 'eat', korean: '먹다', pronunciation: '/iːt/', unit: 'unit1' },
          { id: '4', english: 'drink', korean: '마시다', pronunciation: '/drɪŋk/', unit: 'unit1' },
          { id: '5', english: 'sleep', korean: '자다', pronunciation: '/sliːp/', unit: 'unit1' },
        ]
      },
      {
        id: 'unit2',
        name: 'Unit 2 - 기본 명사',
        totalWords: 5,
        words: [
          { id: '6', english: 'house', korean: '집', pronunciation: '/haʊs/', unit: 'unit2' },
          { id: '7', english: 'car', korean: '자동차', pronunciation: '/kɑːr/', unit: 'unit2' },
          { id: '8', english: 'book', korean: '책', pronunciation: '/bʊk/', unit: 'unit2' },
          { id: '9', english: 'phone', korean: '전화', pronunciation: '/foʊn/', unit: 'unit2' },
          { id: '10', english: 'computer', korean: '컴퓨터', pronunciation: '/kəmˈpjuːtər/', unit: 'unit2' },
        ]
      },
      {
        id: 'unit3',
        name: 'Unit 3 - 색깔',
        totalWords: 5,
        words: [
          { id: '11', english: 'red', korean: '빨간색', pronunciation: '/red/', unit: 'unit3' },
          { id: '12', english: 'blue', korean: '파란색', pronunciation: '/bluː/', unit: 'unit3' },
          { id: '13', english: 'green', korean: '초록색', pronunciation: '/ɡriːn/', unit: 'unit3' },
          { id: '14', english: 'yellow', korean: '노란색', pronunciation: '/ˈjeloʊ/', unit: 'unit3' },
          { id: '15', english: 'black', korean: '검은색', pronunciation: '/blæk/', unit: 'unit3' },
        ]
      }
    ]
  },
  {
    id: 'book2',
    name: '중급 단어장 1',
    totalUnits: 8,
    units: [
      {
        id: 'unit4',
        name: 'Unit 1 - 감정 표현',
        totalWords: 5,
        words: [
          { id: '16', english: 'happy', korean: '행복한', pronunciation: '/ˈhæpi/', unit: 'unit4' },
          { id: '17', english: 'sad', korean: '슬픈', pronunciation: '/sæd/', unit: 'unit4' },
          { id: '18', english: 'angry', korean: '화난', pronunciation: '/ˈæŋɡri/', unit: 'unit4' },
          { id: '19', english: 'excited', korean: '흥미진진한', pronunciation: '/ɪkˈsaɪtɪd/', unit: 'unit4' },
          { id: '20', english: 'worried', korean: '걱정스러운', pronunciation: '/ˈwɜːrid/', unit: 'unit4' },
        ]
      },
      {
        id: 'unit5',
        name: 'Unit 2 - 직업',
        totalWords: 5,
        words: [
          { id: '21', english: 'teacher', korean: '교사', pronunciation: '/ˈtiːtʃər/', unit: 'unit5' },
          { id: '22', english: 'doctor', korean: '의사', pronunciation: '/ˈdɑːktər/', unit: 'unit5' },
          { id: '23', english: 'engineer', korean: '엔지니어', pronunciation: '/ˌendʒɪˈnɪr/', unit: 'unit5' },
          { id: '24', english: 'artist', korean: '예술가', pronunciation: '/ˈɑːrtɪst/', unit: 'unit5' },
          { id: '25', english: 'chef', korean: '요리사', pronunciation: '/ʃef/', unit: 'unit5' },
        ]
      }
    ]
  }
];

// 단어장 ID로 단어장 가져오기
export const getVocabularyBook = (bookId: string): VocabularyBook | null => {
  return vocabularyBooks.find(book => book.id === bookId) || null;
};

// 단원 ID로 단원 가져오기
export const getVocabularyUnit = (unitId: string): VocabularyUnit | null => {
  for (const book of vocabularyBooks) {
    const unit = book.units.find(u => u.id === unitId);
    if (unit) return unit;
  }
  return null;
};

// 단어 ID로 단어 가져오기
export const getVocabularyWord = (wordId: string): VocabularyWord | null => {
  for (const book of vocabularyBooks) {
    for (const unit of book.units) {
      const word = unit.words.find(w => w.id === wordId);
      if (word) return word;
    }
  }
  return null;
};

// 배정된 과제의 단어 목록 가져오기
export const getAssignedWords = (assignment: any): VocabularyWord[] => {
  console.log('=== getAssignedWords ===');
  console.log('Assignment object:', assignment);
  console.log('Assignment type:', typeof assignment);
  console.log('Assignment keys:', Object.keys(assignment || {}));
  console.log('Assignment startUnit:', assignment?.startUnit);
  console.log('Assignment vocabularyData:', assignment?.vocabularyData);
  console.log('Assignment weeklySchedule:', assignment?.weeklySchedule);
  console.log('Assignment targetDate:', assignment?.targetDate);
  console.log('Assignment targetUnit:', assignment?.targetUnit);
  
  // 1. 먼저 assignment에 vocabularyData가 있는지 확인
  if (assignment && assignment.vocabularyData && Array.isArray(assignment.vocabularyData)) {
    console.log('Using assignment vocabularyData');
    console.log('Total words in vocabularyData:', assignment.vocabularyData.length);
    
    // VocabularyWord 형식으로 변환
    let allWords = assignment.vocabularyData.map((word: any, index: number) => ({
      id: `word_${index}`,
      english: word.english,
      korean: word.korean || word.meaning, // korean 필드 우선, 없으면 meaning 사용
      pronunciation: word.pronunciation,
      unit: word.unit,
    }));
    
    // 1-1. targetUnit이 지정되어 있으면 해당 단원만 반환
    if (assignment.targetUnit) {
      console.log('Using targetUnit:', assignment.targetUnit);
      const targetWords = allWords.filter((word: VocabularyWord) => word.unit === assignment.targetUnit);
      console.log('Target unit words count:', targetWords.length);
      return targetWords;
    }
    
    // 2. startUnit이 있으면 해당 단원부터 필터링
    if (assignment.startUnit) {
      console.log('Filtering by startUnit:', assignment.startUnit);
      
      // 모든 단원 목록 추출 (순서 유지)
      const unitOrder: string[] = [];
      const unitSet = new Set<string>();
      
      assignment.vocabularyData.forEach((word: any) => {
        if (!unitSet.has(word.unit)) {
          unitSet.add(word.unit);
          unitOrder.push(word.unit);
        }
      });
      
      // 단원 목록을 정렬 (숫자 형태의 단원도 올바르게 정렬)
      unitOrder.sort((a, b) => {
        // 숫자로 변환 가능한 경우 숫자로 비교
        const aNum = parseInt(a);
        const bNum = parseInt(b);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        
        // 그 외의 경우 문자열로 비교
        return a.localeCompare(b, 'ko-KR', { numeric: true });
      });
      
      console.log('All units in order:', unitOrder);
      
      const startUnitIndex = unitOrder.indexOf(assignment.startUnit);
      console.log('Start unit index:', startUnitIndex);
      
      if (startUnitIndex !== -1) {
        // 3. 오늘의 학습 단원 계산 (주간 스케줄 기반)
        if (assignment.weeklySchedule && assignment.startDate) {
          // targetDate가 있으면 해당 날짜 사용, 없으면 오늘 날짜 사용
          const targetDate = assignment.targetDate ? new Date(assignment.targetDate) : new Date();
          const studyDayNumber = calculateStudyDayNumberForDate(assignment, targetDate);
          console.log('Study day number for date:', studyDayNumber);
          
          if (studyDayNumber !== null && studyDayNumber > 0) {
            // 학습할 단원 인덱스 계산 (1일차는 startUnit)
            const targetUnitIndex = startUnitIndex + (studyDayNumber - 1);
            console.log('Target unit index:', targetUnitIndex);
            
            if (targetUnitIndex < unitOrder.length) {
              const targetUnit = unitOrder[targetUnitIndex];
              console.log('Target unit:', targetUnit);
              
              // 해당 단원의 단어만 반환
              const targetWords = allWords.filter((word: VocabularyWord) => word.unit === targetUnit);
              console.log('Target words count:', targetWords.length);
              
              return targetWords;
            } else {
              console.log('All units completed');
              return [];
            }
          }
        }
        
        // 주간 스케줄이 없거나 학습일이 아닌 경우
        // startUnit부터의 모든 단어 반환
        const remainingUnits = unitOrder.slice(startUnitIndex);
        console.log('Returning words from units:', remainingUnits);
        return allWords.filter((word: VocabularyWord) => remainingUnits.includes(word.unit));
      }
    }
    
    // startUnit이 없으면 모든 단어 반환
    console.log('No startUnit, returning all words');
    return allWords;
  }
  
  // 4. assignment에 vocabularyData가 없으면 task에서 가져오기 시도
  console.log('No vocabularyData in assignment, trying to load from tasks');
  try {
    const { loadTasks } = require('./storage');
    const tasks = loadTasks();
    console.log('Loaded tasks count:', tasks.length);
    
    const matchingTask = tasks.find((task: any) => 
      task.id === assignment.taskId || task.title === assignment.taskTitle
    );
    
    if (matchingTask && matchingTask.vocabularyData) {
      console.log('Found matching task with vocabularyData');
      // 재귀 호출하여 vocabularyData를 포함한 assignment로 다시 처리
      return getAssignedWords({
        ...assignment,
        vocabularyData: matchingTask.vocabularyData
      });
    }
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
  
  console.log('No words found, returning empty array');
  return [];
};

// 특정 날짜의 학습일 번호 계산 헬퍼 함수
const calculateStudyDayNumberForDate = (assignment: any, targetDate: Date): number | null => {
  if (!assignment.weeklySchedule || !assignment.startDate) {
    return null;
  }
  
  const startDate = new Date(assignment.startDate);
  targetDate.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  
  // 목표일이 시작일 이전이면 null
  if (targetDate < startDate) {
    console.log('Target date is before start date');
    return null;
  }
  
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  let studyDayCount = 0;
  
  // startDate부터 targetDate까지 학습일 수 계산
  const currentDate = new Date(startDate);
  while (currentDate <= targetDate) {
    const dayName = dayNames[currentDate.getDay()];
    if (assignment.weeklySchedule[dayName]?.isActive) {
      studyDayCount++;
      if (currentDate.getTime() === targetDate.getTime()) {
        // 목표일이 학습일이면 studyDayCount 반환
        return studyDayCount;
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // 목표일이 학습일이 아니면 null
  console.log('Target date is not a study day');
  return null;
};

// 단어장 목록 가져오기
export const getAllVocabularyBooks = (): VocabularyBook[] => {
  return vocabularyBooks;
};

// 단어장의 모든 단어 가져오기
export const getAllWordsFromBook = (bookId: string): VocabularyWord[] => {
  const book = getVocabularyBook(bookId);
  if (!book) return [];

  const allWords: VocabularyWord[] = [];
  book.units.forEach(unit => {
    allWords.push(...unit.words);
  });
  
  return allWords;
}; 