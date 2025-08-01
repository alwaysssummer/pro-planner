// Google Sheets API를 사용하여 데이터를 파싱하는 함수들

interface VocabularyData {
  unit: string;
  english: string;
  meaning: string;
}

// 구글 시트 URL에서 스프레드시트 ID를 추출하는 함수
export const extractSpreadsheetId = (url: string): string | null => {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

// 구글 시트 URL을 API URL로 변환하는 함수
export const convertToApiUrl = (url: string): string | null => {
  const spreadsheetId = extractSpreadsheetId(url);
  if (!spreadsheetId) return null;
  
  // 여러 가지 형식의 URL을 지원
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=Sheet1`;
};

// CSV 데이터를 파싱하는 함수
export const parseCSVData = (csvText: string): VocabularyData[] => {
  const lines = csvText.trim().split('\n');
  const data: VocabularyData[] = [];
  
  console.log(`CSV 파싱 시작: 총 ${lines.length - 1}개의 행`);
  
  // 첫 번째 줄은 헤더이므로 건너뛰기
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // 구글 시트의 CSV 형식에 맞게 파싱
    const columns = line.split(',').map(col => {
      // 따옴표 제거 및 공백 제거
      return col.replace(/^"/, '').replace(/"$/, '').trim();
    });
    
    // 빈 행 건너뛰기
    if (columns.length >= 3 && columns[0] && columns[1] && columns[2]) {
      data.push({
        unit: columns[0] || '',
        english: columns[1] || '',
        meaning: columns[2] || '',
      });
    }
  }
  
  console.log(`CSV 파싱 완료: ${data.length}개의 유효한 단어 데이터`);
  return data;
};

// 구글 시트에서 데이터를 가져오는 함수
export const fetchGoogleSheetData = async (url: string): Promise<VocabularyData[]> => {
  try {
    const apiUrl = convertToApiUrl(url);
    if (!apiUrl) {
      throw new Error('유효하지 않은 구글 시트 URL입니다.');
    }

    // CORS 우회를 위해 프록시 서버 사용
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error('구글 시트에 접근할 수 없습니다. 공개 설정을 확인해주세요.');
    }

    const csvText = await response.text();
    return parseCSVData(csvText);
  } catch (error) {
    console.error('구글 시트 데이터 가져오기 실패:', error);
    throw error;
  }
};

// 구글 시트가 공개되어 있는지 확인하는 함수
export const validateGoogleSheetUrl = (url: string): boolean => {
  return url.includes('docs.google.com/spreadsheets/d/');
}; 