import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfig, validateConfig } from './config'

// 환경별 설정 가져오기
const config = getSupabaseConfig()

// 환경 변수 확인
export const checkEnvironmentVariables = () => {
  console.log('환경 변수 확인:')
  console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? '설정됨' : '설정되지 않음')
  console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? '설정됨' : '설정되지 않음')
  
  // 새로운 config 검증 시스템 사용
  if (!validateConfig(config)) {
    console.error('⚠️ Supabase 환경 변수가 설정되지 않았습니다!')
    console.error('📝 .env 파일에 다음을 추가하세요:')
    console.error('REACT_APP_SUPABASE_URL=your_supabase_url')
    console.error('REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key')
    return false
  }
  return true
}

export const supabase = createClient(config.url, config.anonKey)

// 테스트 함수
export const testConnection = async () => {
  try {
    // 환경 변수 확인
    if (!checkEnvironmentVariables()) {
      return false
    }
    
    // 실제로 존재하는 students 테이블을 사용하여 연결 테스트
    const { data, error } = await supabase.from('students').select('*').limit(1)
    if (error) {
      console.log('Supabase 연결 테스트 에러:', error)
      return false
    }
    console.log('✅ Supabase 연결 성공! students 테이블 접근 가능')
    return true
  } catch (err) {
    console.error('❌ Supabase 연결 실패:', err)
    return false
  }
} 