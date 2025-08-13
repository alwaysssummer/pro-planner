import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  IconButton,
  useTheme,
  useMediaQuery,
  Container,
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Help as HelpIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { getAssignedWords, VocabularyWord } from '../utils/vocabularyData';

interface LearningSession {
  id: string;
  words: VocabularyWord[];
  currentWordIndex: number;
  completedWords: string[];
  triangleWords: string[];
  xWords: string[];
  isCompleted: boolean;
  startTime: Date;
  endTime?: Date;
  round: number; // 회차 추가
}

interface LearningResult {
  round: number;
  totalWords: number;
  completedWords: number;
  triangleWords: number;
  xWords: number;
  startTime: Date;
  endTime: Date;
  wordStates?: Array<{
    word: VocabularyWord;
    status: 'complete' | 'repeat' | 'forgot';
  }>;
}

interface VocabularyLearningProps {
  assignment: any; // TaskAssignment 타입
  onComplete: (results: LearningResult[]) => void; // 결과 배열로 변경
  onClose: () => void;
  timerDuration?: number; // 타이머 시간 (초)
}

const VocabularyLearning: React.FC<VocabularyLearningProps> = ({
  assignment,
  onComplete,
  onClose,
  timerDuration = 1.5, // 기본값 1.5초
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [session, setSession] = useState<LearningSession | null>(null);
  const [currentWord, setCurrentWord] = useState<VocabularyWord | null>(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [doubleCheckTimer, setDoubleCheckTimer] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [firstChoice, setFirstChoice] = useState<'circle' | 'triangle' | 'x' | null>(null);
  const [learningResults, setLearningResults] = useState<LearningResult[]>([]); // 학습 결과 저장
  const [hasUserClickedMeaning, setHasUserClickedMeaning] = useState(false); // 사용자가 뜻을 클릭했는지 추적
  const [elapsedTime, setElapsedTime] = useState(0); // 경과 시간 (초)

  useEffect(() => {
    initializeSession();
  }, [assignment]);

  // 경과 시간 타이머
  useEffect(() => {
    if (!session || showResults) return;
    
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [session, showResults]);

  // 시간 포맷팅 함수
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}분 ${remainingSeconds.toString().padStart(2, '0')}초`;
  };

  const initializeSession = useCallback(() => {
    // 배정된 과제의 단어 목록 가져오기
    console.log('=== VocabularyLearning initializeSession ===');
    console.log('Assignment object:', assignment);
    console.log('Assignment type:', typeof assignment);
    console.log('Assignment keys:', Object.keys(assignment || {}));
    console.log('Assignment properties:');
    console.log('  - taskId:', assignment?.taskId);
    console.log('  - taskTitle:', assignment?.taskTitle);
    console.log('  - area:', assignment?.area);
    console.log('  - startUnit:', assignment?.startUnit);
    console.log('  - startDate:', assignment?.startDate);
    console.log('  - weeklySchedule:', assignment?.weeklySchedule);
    console.log('  - vocabularyData:', assignment?.vocabularyData);
    console.log('  - vocabularyData length:', assignment?.vocabularyData?.length);
    
    const assignedWords = getAssignedWords(assignment);
    
    console.log('Returned from getAssignedWords:');
    console.log('  - Words count:', assignedWords.length);
    console.log('  - First word:', assignedWords[0]);
    console.log('  - All words:', assignedWords.map(w => ({ english: w.english, korean: w.korean, unit: w.unit })));
    console.log('=== End initializeSession ===');
    
    if (assignedWords.length === 0) {
      console.error('No words assigned to this task');
      alert('학습할 단어가 없습니다. 오늘은 학습일이 아니거나 모든 단원을 완료했을 수 있습니다.');
      onClose();
      return;
    }
    
    const newSession: LearningSession = {
      id: Date.now().toString(),
      words: assignedWords,
      currentWordIndex: 0,
      completedWords: [],
      triangleWords: [],
      xWords: [],
      isCompleted: false,
      startTime: new Date(),
      round: 1, // 1회차로 시작
    };
         setSession(newSession);
     setCurrentWord(assignedWords[0]);
     setElapsedTime(0); // 새로운 세션 시작 시 타이머 리셋
  }, [assignment, onClose]);



  const handleWordCheck = (checkType: 'circle' | 'triangle') => {
    if (!session || !currentWord) return;

    setFirstChoice(checkType);
    setShowMeaning(true);
    setHasUserClickedMeaning(false); // 새로운 단어 시작 시 리셋
    
    // 타이머 시작
    setDoubleCheckTimer(timerDuration);
  };

  const handleMistaken = () => {
    if (!session || !currentWord || !firstChoice) return;

    console.log('handleMistaken 호출됨:', { currentWord: currentWord.english, firstChoice });
    
    const updatedSession = { ...session };
    
    // 기존 선택을 제거하고 triangle(재학습)로 변경
    updatedSession.completedWords = updatedSession.completedWords.filter(id => id !== currentWord.id);
    updatedSession.triangleWords = updatedSession.triangleWords.filter(id => id !== currentWord.id);
    updatedSession.xWords = updatedSession.xWords.filter(id => id !== currentWord.id);
    
    // 재학습으로 분류
    updatedSession.triangleWords.push(currentWord.id);

    console.log('handleMistaken 후 session 상태:', {
      completedWords: updatedSession.completedWords.length,
      triangleWords: updatedSession.triangleWords.length,
      xWords: updatedSession.xWords.length
    });

    setSession(updatedSession);
    setShowMeaning(false);
    setDoubleCheckTimer(0);
    setFirstChoice(null);
    setHasUserClickedMeaning(true); // 사용자가 뜻을 클릭했음을 표시
    
    // 즉시 다음 단어로 이동하지 않고 상태 업데이트가 완료될 때까지 기다림
    const nextIndex = updatedSession.currentWordIndex + 1;
    
    if (nextIndex >= updatedSession.words.length) {
      // 현재 회차 완료 - completeRound 호출
      completeRound();
    } else {
      // 다음 단어로
      setSession({ ...updatedSession, currentWordIndex: nextIndex });
      setCurrentWord(updatedSession.words[nextIndex]);
      setShowMeaning(false);
      setHasUserClickedMeaning(false); // 다음 단어 시작 시 리셋
    }
  };

  const confirmChoice = () => {
    if (!session || !currentWord || !firstChoice) return;

    console.log('confirmChoice 호출됨:', { currentWord: currentWord.english, firstChoice });
    
    const updatedSession = { ...session };
    
    // 첫 번째 선택을 확정
    if (firstChoice === 'circle') {
      updatedSession.completedWords.push(currentWord.id);
    } else { // triangle (모르는 경우)
      updatedSession.triangleWords.push(currentWord.id);
    }

    console.log('confirmChoice 후 session 상태:', {
      completedWords: updatedSession.completedWords.length,
      triangleWords: updatedSession.triangleWords.length,
      xWords: updatedSession.xWords.length
    });

    setSession(updatedSession);
    setShowMeaning(false);
    setDoubleCheckTimer(0);
    setFirstChoice(null);
    
    // 즉시 다음 단어로 이동
    const nextIndex = updatedSession.currentWordIndex + 1;
    
    if (nextIndex >= updatedSession.words.length) {
      // 현재 회차 완료 - completeRound 호출
      completeRound();
    } else {
      // 다음 단어로
      setSession({ ...updatedSession, currentWordIndex: nextIndex });
      setCurrentWord(updatedSession.words[nextIndex]);
      setShowMeaning(false);
      setHasUserClickedMeaning(false); // 다음 단어 시작 시 리셋
    }
  };

  const completeRound = useCallback(() => {
    if (!session) return;
    
    const endTime = new Date();
    
    // 현재 회차 결과 저장 (각 단어의 상태 포함)
    const wordStates = session.words.map(word => {
      let status: 'complete' | 'repeat' | 'forgot';
      
      if (session.completedWords.includes(word.id)) {
        status = 'complete'; // 완전히 알고 있어요
      } else if (session.triangleWords.includes(word.id)) {
        status = 'repeat'; // 1번 더 볼래요
      } else {
        status = 'forgot'; // 아 몰랐어요 (체크하지 않은 경우)
      }
      
      return {
        word: word,
        status: status
      };
    });
    
    const roundResult: LearningResult = {
      round: session.round,
      totalWords: session.words.length,
      completedWords: session.completedWords.length,
      triangleWords: session.triangleWords.length,
      xWords: 0, // X 로직 제거로 항상 0
      startTime: session.startTime,
      endTime: endTime,
      wordStates: wordStates, // 각 단어의 상태 추가
    };
    
    const newResults = [...learningResults, roundResult];
    setLearningResults(newResults);
    
    // 동그라미 하지 않은 단어들 확인
    const remainingWords = session.words.filter(word => 
      !session.completedWords.includes(word.id)
    );
    
    console.log(`${session.round}회차 완료. 남은 단어:`, remainingWords.length);
    
    if (remainingWords.length === 0) {
      // 모든 단어를 완료한 경우
      setShowResults(true);
    } else {
      // 다음 회차 학습 자동 시작
      const newSession: LearningSession = {
        id: Date.now().toString(),
        words: remainingWords,
        currentWordIndex: 0,
        completedWords: [],
        triangleWords: [],
        xWords: [],
        isCompleted: false,
        startTime: new Date(),
        round: session.round + 1,
      };
      
      setSession(newSession);
      setCurrentWord(remainingWords[0]);
      setShowMeaning(false);
      setHasUserClickedMeaning(false); // 새로운 회차 시작 시 리셋
      setElapsedTime(0); // 새로운 회차 시작 시 타이머 리셋
      
      // 다음 회차 시작 알림 (오답학습인 경우 다른 메시지)
      const isWrongAnswerLearning = assignment?.isWrongAnswerLearning;
      if (isWrongAnswerLearning) {
        alert(`${session.round}회차 오답학습이 완료되었습니다.\n동그라미 하지 않은 ${remainingWords.length}개 단어로 ${session.round + 1}회차 오답학습을 시작합니다.`);
      } else {
        alert(`${session.round}회차 학습이 완료되었습니다.\n동그라미 하지 않은 ${remainingWords.length}개 단어로 ${session.round + 1}회차 학습을 시작합니다.`);
      }
    }
  }, [session, learningResults, assignment]);

  useEffect(() => {
    if (doubleCheckTimer > 0) {
      const timer = setTimeout(() => {
        setDoubleCheckTimer(prev => Math.max(0, prev - 0.1));
      }, 100);
      return () => clearTimeout(timer);
    } else if (doubleCheckTimer === 0 && showMeaning && firstChoice && !hasUserClickedMeaning) {
      // 사용자가 뜻을 클릭하지 않았을 때만 confirmChoice 호출
      confirmChoice();
    }
  }, [doubleCheckTimer, showMeaning, firstChoice, hasUserClickedMeaning, confirmChoice]);

  const getProgress = () => {
    if (!session) return 0;
    const totalWords = session.words.length;
    const processedWords = session.currentWordIndex + 1;
    return (processedWords / totalWords) * 100;
  };

  const handleFinalComplete = () => {
    // 전체 학습에서 최종적으로 완료한 단어 수 계산
    const totalWordsLearned = learningResults[0]?.totalWords || 0;
    
    // 1회차에서 완료한 단어 수
    const firstRoundCompleted = learningResults.length > 1 
      ? totalWordsLearned - learningResults[1].totalWords 
      : learningResults[0]?.completedWords || 0;
    
    // 마지막 회차에서 완료한 단어 수
    const lastRoundCompleted = learningResults.length > 1
      ? learningResults[learningResults.length - 1].completedWords
      : 0;
    
    // 실제 최종 완료 단어 수
    const actualFinalCompletedWords = firstRoundCompleted + lastRoundCompleted;
    
    // 결과 배열의 마지막 요소를 수정하여 정확한 완료 단어 수 반영
    const correctedResults = learningResults.map((result, index) => {
      if (index === learningResults.length - 1) {
        return {
          ...result,
          actualFinalCompletedWords // 실제 최종 완료 단어 수 추가
        };
      }
      return result;
    });
    
    onComplete(correctedResults);
  };



  if (!session || !currentWord) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>학습을 준비하는 중...</Typography>
      </Box>
    );
  }

  if (showResults) {
    // 최종 결과 계산
    const totalWordsLearned = learningResults[0]?.totalWords || 0;
    
    // 전체 학습에서 최종적으로 동그라미(완료)한 단어 수 계산
    // 마지막 회차의 결과가 최종 결과
    const lastRoundResult = learningResults[learningResults.length - 1];
    const finalCompletedWords = lastRoundResult ? lastRoundResult.completedWords : 0;
    
    // 1회차에서 완료한 단어 수 계산 (전체 - 2회차에 넘어간 단어)
    const firstRoundCompleted = learningResults.length > 1 
      ? totalWordsLearned - learningResults[1].totalWords 
      : totalWordsLearned;
    
    // 실제 최종 완료 단어 수 = 1회차 완료 + 마지막 회차 완료
    const actualFinalCompletedWords = learningResults.length > 1 
      ? firstRoundCompleted + finalCompletedWords
      : finalCompletedWords;
    
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Card sx={{ borderRadius: isMobile ? 2 : 1 }}>
          <CardContent sx={{ p: isMobile ? 3 : 2 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                모든 학습 완료!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                총 {learningResults.length}회차 학습을 완료했습니다.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                전체 학습 결과
              </Typography>
              
              {/* 회차별 결과 */}
              {learningResults.map((result, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {result.round}회차 학습
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        완료: {result.completedWords}개
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        재학습: {result.triangleWords}개
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        미완료: {result.xWords}개
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              
              {/* 최종 결과 요약 */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  최종 결과
                </Typography>
                <Typography variant="body1">
                  총 {totalWordsLearned}개 단어 중 {actualFinalCompletedWords}개 완료
                  ({Math.round((actualFinalCompletedWords / totalWordsLearned) * 100)}%)
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={handleFinalComplete}
                size={isMobile ? "large" : "medium"}
              >
                학습 완료
              </Button>
              <Button
                variant="outlined"
                onClick={onClose}
                size={isMobile ? "large" : "medium"}
              >
                닫기
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <ArrowBackIcon />
        </IconButton>
      </Box>

      {/* 진행률 */}
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            {session.round}회차 진행률: {Math.round(getProgress())}%
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            {session.currentWordIndex + 1} / {session.words.length}
          </Typography>
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={getProgress()}
          sx={{ height: 4, borderRadius: 2 }}
        />
      </Box>

      {/* 단어 카드 */}
      <Card sx={{ mb: 2, borderRadius: isMobile ? 2 : 1 }}>
        <CardContent sx={{ p: isMobile ? 3 : 2, textAlign: 'center' }}>
                                 <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 1, 
              mb: 1,
              width: '100%',
              minHeight: '40px'
            }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: 'clamp(1.5rem, 4vw, 2.125rem)',
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                  flex: 1,
                  textAlign: 'center'
                }}
              >
                {currentWord.english}
              </Typography>
              {currentWord.pronunciation && (
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  sx={{ 
                    fontStyle: 'italic',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1.25rem)',
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                    flex: 1,
                    textAlign: 'center'
                  }}
                >
                  {currentWord.pronunciation}
                </Typography>
              )}
            </Box>
                                {!currentWord.pronunciation && (
             <Box sx={{ mb: 0.5 }} />
           )}

           {showMeaning ? (
             <Box>
               <Box
                 onClick={handleMistaken}
                 sx={{
                   width: '100%',
                   height: 50,
                   border: '2px dashed #ccc',
                   borderRadius: 2,
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   cursor: 'pointer',
                   backgroundColor: 'rgba(0,0,0,0.02)',
                   mt: 1,
                   mb: 1,
                   '&:hover': {
                     backgroundColor: 'rgba(0,0,0,0.05)',
                     borderColor: '#999'
                   }
                 }}
               >
                                 <Typography 
                   variant="h5" 
                   color="primary" 
                   sx={{ 
                     fontWeight: 600,
                     textAlign: 'center',
                     fontSize: 'clamp(1.25rem, 3.5vw, 1.5rem)',
                     lineHeight: 1.2,
                     wordBreak: 'break-word',
                     padding: '0 8px'
                   }}
                 >
                   {currentWord.korean}
                 </Typography>
              </Box>
            </Box>
          ) : (
                         <Box>
               <Box sx={{ 
                 display: 'flex', 
                 justifyContent: 'center', 
                 gap: 1,
                 height: 50,
                 mt: 1,
                 mb: 1,
                 width: '100%'
               }}>
                 <Button
                   variant="contained"
                   color="success"
                   size="large"
                   onClick={() => handleWordCheck('circle')}
                   sx={{ 
                     py: 1,
                     px: 2,
                     borderRadius: 2,
                     whiteSpace: 'nowrap',
                     fontSize: isMobile ? '0.8rem' : '0.9rem',
                     flex: 1,
                     height: 50,
                     '&:hover': { transform: 'scale(1.02)' }
                   }}
                 >
                   <CheckCircleIcon sx={{ fontSize: isMobile ? 16 : 18 }} />
                 </Button>
                 
                 <Button
                   variant="contained"
                   size="large"
                   onClick={() => handleWordCheck('triangle')}
                   sx={{ 
                     py: 1,
                     px: 2,
                     borderRadius: 2,
                     whiteSpace: 'nowrap',
                     fontSize: isMobile ? '0.8rem' : '0.9rem',
                     flex: 1,
                     height: 50,
                     backgroundColor: '#FFD700',
                     color: 'black',
                     '&:hover': { 
                       backgroundColor: '#FFC700',
                       transform: 'scale(1.02)' 
                     }
                   }}
                 >
                   <HelpIcon sx={{ mr: 0.5, fontSize: isMobile ? 16 : 18 }} />
                   한번 더
                 </Button>
               </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 학습 통계 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', mt: 1 }}>
        <Box>
          <Typography variant="h6" color="success.main" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            {session.completedWords.length}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            완료
          </Typography>
        </Box>
        <Box>
          <Typography variant="h6" color="warning.main" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            {session.triangleWords.length}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            재학습
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default VocabularyLearning; 