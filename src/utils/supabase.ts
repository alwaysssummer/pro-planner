import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 테스트 함수
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('test').select('*').limit(1)
    if (error) {
      console.log('Supabase 연결 테스트 에러:', error)
      return false
    }
    console.log('Supabase 연결 성공!')
    return true
  } catch (err) {
    console.error('Supabase 연결 실패:', err)
    return false
  }
} 