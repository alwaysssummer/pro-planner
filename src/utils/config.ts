// 환경별 Supabase 설정
interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// 개발 환경 설정
const developmentConfig: SupabaseConfig = {
  url: process.env.REACT_APP_SUPABASE_URL || '',
  anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || ''
};

// 프로덕션 환경 설정 (배포 시 사용)
const productionConfig: SupabaseConfig = {
  url: process.env.REACT_APP_SUPABASE_URL || '',
  anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || ''
};

// 현재 환경에 따른 설정 반환
export const getSupabaseConfig = (): SupabaseConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('🔧 개발 환경 설정 사용');
    return developmentConfig;
  } else {
    console.log('🚀 프로덕션 환경 설정 사용');
    return productionConfig;
  }
};

// 환경 변수 유효성 검사
export const validateConfig = (config: SupabaseConfig): boolean => {
  if (!config.url || !config.anonKey) {
    console.error('❌ Supabase 설정이 완료되지 않았습니다.');
    console.error('📝 환경 변수를 확인하세요:');
    console.error('   - REACT_APP_SUPABASE_URL');
    console.error('   - REACT_APP_SUPABASE_ANON_KEY');
    return false;
  }
  
  if (!config.url.includes('supabase.co')) {
    console.error('❌ 잘못된 Supabase URL 형식입니다.');
    return false;
  }
  
  console.log('✅ Supabase 설정이 유효합니다.');
  return true;
};
