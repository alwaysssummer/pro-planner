import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  LinearProgress,
  IconButton,
  useTheme,
  useMediaQuery,
  Container,
  Alert,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
  Send as SendIcon,
} from '@mui/icons-material';

interface EvaluationWord {
  id: string;
  word: string;
  meaning: string;
  example?: string;
}

interface EvaluationResult {
  wordId: string;
  word: string;
  userAnswer: string;
  correctAnswer: string;
  score: number;
  isCorrect: boolean;
}

interface VocabularyEvaluationProps {
  vocabularyData: EvaluationWord[];
  onComplete: (results: EvaluationResult[]) => void;
  onClose: () => void;
}

const VocabularyEvaluation: React.FC<VocabularyEvaluationProps> = ({
  vocabularyData,
  onComplete,
  onClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null);
  const [autoNextTimer, setAutoNextTimer] = useState<NodeJS.Timeout | null>(null);
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);
  
  // 라운드 관리 상태
  const [currentRound, setCurrentRound] = useState(1);
  const [wordsToEvaluate, setWordsToEvaluate] = useState<EvaluationWord[]>(vocabularyData);
  const [allResults, setAllResults] = useState<EvaluationResult[]>([]);
  const [isEvaluationComplete, setIsEvaluationComplete] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // 경과 시간 (초)

  // 평가 완료 후 자동으로 다음 단어 이동
  useEffect(() => {
    if (showResult && currentResult) {
      // 기존 타이머가 있다면 정리
      if (autoNextTimer) {
        clearTimeout(autoNextTimer);
      }
      
      // 2초 후 자동으로 다음 단어로 이동
      const timer = setTimeout(() => {
        handleNextWord();
      }, 2000);
      
      setAutoNextTimer(timer);
    }
    
    // 클린업 함수
    return () => {
      if (autoNextTimer) {
        clearTimeout(autoNextTimer);
        setAutoNextTimer(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult, currentResult]);

  // 경과 시간 타이머
  useEffect(() => {
    if (isEvaluationComplete) return;
    
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isEvaluationComplete]);

  // 시간 포맷팅 함수
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}분 ${remainingSeconds.toString().padStart(2, '0')}초`;
  };

  // 다음 단어로 넘어갈 때 입력창 자동 포커스
  useEffect(() => {
    if (!showResult && inputRef) {
      // 약간의 지연을 두어 DOM 업데이트 후 포커스
      setTimeout(() => {
        inputRef.focus();
      }, 100);
    }
  }, [currentWordIndex, showResult, inputRef]);

  // 평가 완료 상태 체크
  if (isEvaluationComplete) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              평가가 완료되었습니다!
            </Typography>
            <Button onClick={onClose} sx={{ mt: 2 }}>
              닫기
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // 데이터 유효성 검사
  if (!vocabularyData || vocabularyData.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="error">
              평가할 단어가 없습니다.
            </Typography>
            <Button onClick={onClose} sx={{ mt: 2 }}>
              닫기
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const progress = ((currentWordIndex + 1) / wordsToEvaluate.length) * 100;
  const currentWord = wordsToEvaluate[currentWordIndex];


  // 디버깅 로그 추가
  console.log('=== VocabularyEvaluation 디버깅 ===');
  console.log('wordsToEvaluate:', wordsToEvaluate);
  console.log('currentWordIndex:', currentWordIndex);
  console.log('currentWord:', currentWord);
  console.log('currentWord.word:', currentWord?.word);
  console.log('currentWord.meaning:', currentWord?.meaning);

  // 현재 단어가 유효한지 확인
  if (!currentWord) {
    console.error('currentWord가 undefined입니다');
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="error">
              단어 정보를 불러올 수 없습니다.
            </Typography>
            <Button onClick={onClose} sx={{ mt: 2 }}>
              닫기
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // 기호와 부호를 제거하는 함수
  const removeSymbols = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[()\[\]{}<>""''`~!@#$%^&*+=|\\:;'",.?]/g, '') // 괄호, 따옴표, 특수문자 제거
      .replace(/\s+/g, ' '); // 연속된 공백을 하나로
  };

  const evaluateWithGemini = async (userAnswer: string, correctAnswer: string, word: string) => {
    try {
      // API 키를 직접 설정 (환경변수 문제 해결)
      const GEMINI_API_KEY = 'AIzaSyDQJ6SXBexKbCGeU-DXWCVmtfCJ56gAATs';
      
      console.log('=== Gemini API 디버깅 ===');
      console.log('Gemini API 키 설정됨:', !!GEMINI_API_KEY);
      console.log('API 키 앞 10자리:', GEMINI_API_KEY.substring(0, 10) + '...');

      // 기호 제거된 답변들
      const cleanUserAnswer = removeSymbols(userAnswer);
      const cleanCorrectAnswer = removeSymbols(correctAnswer);
      
      console.log('원본 사용자 답변:', userAnswer);
      console.log('정리된 사용자 답변:', cleanUserAnswer);
      console.log('원본 정답:', correctAnswer);
      console.log('정리된 정답:', cleanCorrectAnswer);

      // 기호 제거 후 정확히 일치하면 100점
      if (cleanUserAnswer === cleanCorrectAnswer) {
        console.log('기호 제거 후 완전 일치 - 100점');
        return 100;
      }

      // 핵심 단어 부분 정답 체크
      const checkPartialMatch = (userAnswer: string, correctAnswer: string) => {
        const userWords = userAnswer.toLowerCase().split(/[\s,~을를이가에서의도로]/);
        const correctWords = correctAnswer.toLowerCase().split(/[\s,~을를이가에서의도로]/);
        
        // 핵심 동사/명사 추출 (2글자 이상)
        const userKeywords = userWords.filter(word => word.length >= 2);
        const correctKeywords = correctWords.filter(word => word.length >= 2);
        
        console.log('사용자 키워드:', userKeywords);
        console.log('정답 키워드:', correctKeywords);
        
        // 동의어 매핑
        const synonyms = new Map([
          ['요구하다', ['필요하다', '구하다', '원하다', '바라다']],
          ['필요하다', ['요구하다', '구하다', '원하다', '바라다']],
          ['제공하다', ['주다', '공급하다', '드리다', '건네다']],
          ['주다', ['제공하다', '공급하다', '드리다', '건네다']],
          ['만들다', ['생성하다', '창조하다', '제작하다', '생산하다']],
          ['생성하다', ['만들다', '창조하다', '제작하다', '생산하다']],
        ]);
        
        // 핵심 키워드가 포함되어 있는지 체크
        for (const userKeyword of userKeywords) {
          for (const correctKeyword of correctKeywords) {
            // 직접 매치
            if (userKeyword.includes(correctKeyword) || correctKeyword.includes(userKeyword)) {
              console.log(`키워드 직접 매치: ${userKeyword} <-> ${correctKeyword}`);
              return true;
            }
            
            // 동의어 매치
            const correctSynonyms = synonyms.get(correctKeyword) || [];
            const userSynonyms = synonyms.get(userKeyword) || [];
            
            if (correctSynonyms.includes(userKeyword) || userSynonyms.includes(correctKeyword)) {
              console.log(`동의어 매치: ${userKeyword} <-> ${correctKeyword}`);
              return true;
            }
          }
        }
        
        return false;
      };

      // 부분 정답 체크
      if (checkPartialMatch(cleanUserAnswer, cleanCorrectAnswer)) {
        console.log('핵심 키워드 매치 - 100점');
        return 100;
      }

      const prompt = `다음 영어 단어의 뜻을 채점해주세요:
영어 단어: ${word}
정답: ${correctAnswer}
사용자 답변: ${userAnswer}

채점 기준:
1. 핵심 의미가 일치하면 100점 (완전정답)
2. 핵심 동사나 명사가 포함되어 있으면 100점 처리
   - 예: "A에게 B를 요구하다" → "요구하다", "필요하다"도 100점
   - 예: "~을 제공하다" → "제공하다", "주다"도 100점  
3. 의미가 유사하거나 부분적으로 맞으면 80-90점
4. 완전히 틀리면 0점

점수만 숫자로 답변해주세요.`;

      console.log('Gemini API 호출 시작...');
      console.log('프롬프트:', prompt);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      console.log('API 응답 상태:', response.status);
      console.log('API 응답 OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 응답 오류 내용:', errorText);
        throw new Error(`API 응답 오류: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API 응답 데이터:', data);
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('API 응답 형식 오류:', data);
        throw new Error('API 응답 형식 오류');
      }

      const scoreText = data.candidates[0].content.parts[0].text.trim();
      console.log('추출된 점수 텍스트:', scoreText);
      
      const score = parseInt(scoreText);
      console.log('파싱된 점수:', score);
      
      if (isNaN(score)) {
        throw new Error(`점수 파싱 오류: "${scoreText}"`);
      }
      
      const finalScore = Math.max(0, Math.min(100, score));
      console.log('최종 점수:', finalScore);
      
      return finalScore;
    } catch (error) {
      console.error('Gemini API 호출 실패:', error);
      
      // API 실패 시 기본 채점 로직 (기호 제거 후 비교)
      const cleanUser = removeSymbols(userAnswer);
      const cleanCorrect = removeSymbols(correctAnswer);
      
      if (cleanUser === cleanCorrect) {
        console.log('API 실패 시 기본 채점: 기호 제거 후 완전 일치 - 100점');
        return 100;
      } else if (cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser)) {
        console.log('API 실패 시 기본 채점: 기호 제거 후 부분 일치 - 70점');
        return 70;
      } else {
        console.log('API 실패 시 기본 채점: 기호 제거 후 불일치 - 30점');
        return 30; // API 실패 시 최소 점수 보장
      }
    }
  };

  const handleSubmitAnswer = async () => {
    // 평가 완료 상태 체크
    if (isEvaluationComplete) {
      console.log('평가가 이미 완료되었습니다.');
      return;
    }

    console.log('=== handleSubmitAnswer 디버깅 ===');
    console.log('userAnswer:', userAnswer);
    console.log('userAnswer.trim():', userAnswer?.trim());
    console.log('currentWord:', currentWord);
    console.log('currentWord.meaning:', currentWord?.meaning);
    console.log('currentWord.word:', currentWord?.word);
    console.log('currentWord.id:', currentWord?.id);

    if (!userAnswer || !userAnswer.trim()) {
      console.error('사용자 답변이 비어있음');
      alert('답변을 입력해주세요.');
      return;
    }
    
    if (!currentWord) {
      console.error('currentWord가 undefined');
      alert('단어 정보가 올바르지 않습니다. (currentWord 없음)');
      return;
    }
    
    if (!currentWord.meaning) {
      console.error('currentWord.meaning이 undefined:', currentWord);
      alert('단어 정보가 올바르지 않습니다. (meaning 없음)');
      return;
    }
    
    setIsEvaluating(true);

    try {
      const score = await evaluateWithGemini(userAnswer, currentWord.meaning, currentWord.word);
      const isCorrect = score >= 80;

      const result: EvaluationResult = {
        wordId: currentWord.id || 'unknown',
        word: currentWord.word || 'unknown',
        userAnswer: userAnswer.trim(),
        correctAnswer: currentWord.meaning || 'unknown',
        score: score,
        isCorrect: isCorrect,
      };

      setCurrentResult(result);
      setShowResult(true);
    } catch (error) {
      console.error('평가 중 오류 발생:', error);
      alert('평가 중 오류가 발생했습니다.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextWord = () => {
    // 평가 완료 상태 체크
    if (isEvaluationComplete) {
      console.log('평가가 이미 완료되었습니다.');
      return;
    }

    // 자동 이동 타이머가 있다면 취소
    if (autoNextTimer) {
      clearTimeout(autoNextTimer);
      setAutoNextTimer(null);
    }
    
    if (currentResult) {
      // 현재 결과를 저장
      const newResults = [...evaluationResults, currentResult];
      setEvaluationResults(newResults);
      
      // 전체 결과에도 추가/업데이트
      const updatedAllResults = [...allResults];
      const existingIndex = updatedAllResults.findIndex(r => r.wordId === currentResult.wordId);
      if (existingIndex >= 0) {
        updatedAllResults[existingIndex] = currentResult;
      } else {
        updatedAllResults.push(currentResult);
      }
      setAllResults(updatedAllResults);
    }

    // 다음 단어로 이동 또는 라운드 완료 체크
    if (currentWordIndex + 1 < wordsToEvaluate.length) {
      setCurrentWordIndex(currentWordIndex + 1);
      setUserAnswer('');
      setShowResult(false);
      setCurrentResult(null);
    } else {
      // 라운드 완료 - 현재 라운드의 모든 결과 수집
      const currentRoundResults = [...evaluationResults];
      if (currentResult) {
        currentRoundResults.push(currentResult);
      }
      
      // 현재 라운드에서 80점 미만인 단어들 찾기
      const incompleteWords = wordsToEvaluate.filter((word, index) => {
        const result = currentRoundResults[index];
        return !result || result.score < 80;
      });
      
      console.log('=== 라운드 완료 디버깅 ===');
      console.log('현재 라운드:', currentRound);
      console.log('현재 라운드 결과:', currentRoundResults);
      console.log('미완성 단어 수:', incompleteWords.length);
      console.log('미완성 단어들:', incompleteWords);
      
      if (incompleteWords.length > 0 && currentRound < 3) { // 최대 3라운드로 제한
        // 다음 라운드 시작
        console.log('다음 라운드 시작:', currentRound + 1);
        setCurrentRound(currentRound + 1);
        setWordsToEvaluate(incompleteWords);
        setCurrentWordIndex(0);
        setEvaluationResults([]);
        setUserAnswer('');
        setShowResult(false);
        setCurrentResult(null);
      } else {
        // 모든 단어 완료 또는 최대 라운드 도달
        console.log('평가 완료 - 모든 결과 전달');
        const finalResults = [...allResults];
        if (currentResult) {
          const existingIndex = finalResults.findIndex(r => r.wordId === currentResult.wordId);
          if (existingIndex >= 0) {
            finalResults[existingIndex] = currentResult;
          } else {
            finalResults.push(currentResult);
          }
        }
        setIsEvaluationComplete(true);
        onComplete(finalResults);
      }
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Card sx={{ borderRadius: isMobile ? 2 : 1 }}>
        <CardContent sx={{ p: isMobile ? 3 : 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  단어 평가
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  라운드 {currentRound} - {wordsToEvaluate.length}개 단어
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                {formatTime(elapsedTime)}
              </Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* 진행률 표시 - 항상 표시 */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                {currentWordIndex + 1} / {wordsToEvaluate.length}
              </Typography>
              <Typography variant="body2" color="primary">
                {Math.round(progress)}%
              </Typography>
            </Box>

            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
          </Box>

          <Box>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              {/* 영단어 - 고정 위치 */}
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                {currentWord.word}
              </Typography>
              
              {/* 예문 (있을 경우만, 입력 화면에서만) */}
              {currentWord.example && !showResult && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  예문: {currentWord.example}
                </Typography>
              )}
              
              {/* 입력값/정답 영역 - 최대 폭 사용 */}
              <Box sx={{ mb: 2, position: 'relative', minHeight: '48px', width: '100%', maxWidth: '600px', mx: 'auto' }}>
                {/* 입력값 영역 - 좌측 최대 */}
                <Box sx={{ 
                  position: 'absolute',
                  left: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: showResult ? '45%' : '100%',
                  textAlign: 'left'
                }}>
                  {showResult ? (
                    <Typography sx={{ 
                      color: (currentResult?.score ?? 0) >= 80 ? 'success.main' : 'error.main',
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      wordBreak: 'break-word',
                      overflow: 'hidden'
                    }}>
                      {currentResult?.userAnswer}
                    </Typography>
                  ) : (
                    <TextField
                      variant="standard"
                      placeholder="입력하세요"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isEvaluating && userAnswer.trim()) {
                          e.preventDefault();
                          handleSubmitAnswer();
                        }
                      }}
                      disabled={isEvaluating}
                      inputRef={(ref) => setInputRef(ref)}
                      sx={{
                        width: '100%',
                        '& .MuiInput-underline:before': {
                          borderBottomColor: 'rgba(0, 0, 0, 0.42)',
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottomColor: 'primary.main',
                        },
                        '& .MuiInput-underline:after': {
                          borderBottomColor: 'primary.main',
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '1.5rem',
                          fontWeight: 600,
                          textAlign: 'left',
                          paddingLeft: 0
                        }
                      }}
                    />
                  )}
                </Box>
                
                {/* 슬래시 - 중앙 위치 (결과 시에만) */}
                {showResult && (
                  <Typography sx={{ 
                    position: 'absolute',
                    left: '47%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'text.secondary',
                    fontSize: '1.5rem',
                    fontWeight: 600
                  }}>
                    /
                  </Typography>
                )}
                
                {/* 정답 - 우측 최대 (결과 시에만) */}
                {showResult && (
                  <Typography sx={{ 
                    position: 'absolute',
                    right: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: (currentResult?.score ?? 0) >= 80 ? 'success.main' : 'error.main',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    width: '45%',
                    textAlign: 'left',
                    wordBreak: 'break-word',
                    overflow: 'hidden'
                  }}>
                    {currentResult?.correctAnswer}
                  </Typography>
                )}
              </Box>
              

            </Box>


          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default VocabularyEvaluation; 