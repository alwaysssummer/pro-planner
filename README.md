# Pro Planner - 영어학습 관제 플래너

영어학습을 체계적으로 관리할 수 있는 웹 애플리케이션입니다.

## 기능

### 관리자 기능
- **과제 관리**: 영어 학습 과제를 생성, 편집, 삭제할 수 있습니다.
- **학생 관리**: 학생 정보를 등록하고 관리할 수 있습니다.

## 기술 스택

- React 18
- TypeScript
- Material-UI (MUI)
- React Router

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 개발 서버 실행:
```bash
npm start
```

3. 브라우저에서 `http://localhost:3000`으로 접속

## 프로젝트 구조

```
src/
├── components/
│   └── AdminLayout.tsx      # 관리자 레이아웃 컴포넌트
├── pages/
│   ├── TaskManagement.tsx   # 과제 관리 페이지
│   └── StudentManagement.tsx # 학생 관리 페이지
├── App.tsx                  # 메인 앱 컴포넌트
└── index.tsx               # 앱 진입점
```

## 주요 기능

### 과제 관리
- 과제 생성, 편집, 삭제
- 과제 상태 관리 (대기중, 진행중, 완료)
- 학생 배정 현황 확인

### 학생 관리
- 학생 정보 등록 및 관리
- 영어 레벨별 분류 (초급, 중급, 고급)
- 학생별 배정된 과제 확인

## 향후 개발 예정 기능

- 학생별 학습 진도 관리
- 과제 제출 및 평가 시스템
- 학습 통계 및 리포트
- 알림 시스템

## Gemini AI 설정

이 프로젝트는 Google Gemini AI를 활용한 단어 평가 기능을 포함합니다.

### 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

### 또는 npm 스크립트 사용

Windows 환경에서는 다음 명령어를 사용하세요:

```bash
npm run start:gemini
```

### Gemini API 키 발급

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 API 키를 발급받으세요
2. 환경변수에 설정하거나 npm 스크립트를 사용하세요

### AI 평가 기능

- **AI 채점**: Gemini AI를 활용한 정확한 뜻입력 평가
- **로컬 채점**: API 실패 시 자동으로 로컬 채점으로 대체
- **실시간 평가**: 입력 즉시 정답 여부 확인

## 구글 시트 연동 방법

### 1. 구글 시트 준비
1. 구글 시트를 생성하고 단어장 데이터를 입력
2. 헤더: 단원명 | 영어 | 뜻
3. 시트를 공개로 설정 (파일 > 공유 > 웹에 게시)

### 2. 공개 URL 생성
1. 구글 시트에서 "파일" > "공유" > "웹에 게시"
2. "링크" 탭에서 "게시" 클릭
3. 생성된 URL을 복사

### 3. 과제에 연결
1. 과제 관리 페이지에서 작업 아이콘 클릭
2. 구글 시트 URL 입력
3. "미리보기" 버튼으로 데이터 확인
4. "링크 저장" 버튼으로 과제에 연결

### 4. 데이터 형식 예시
```
단원명    | 영어      | 뜻
Unit 1   | apple     | 사과
Unit 1   | banana    | 바나나
Unit 2   | computer  | 컴퓨터
``` 