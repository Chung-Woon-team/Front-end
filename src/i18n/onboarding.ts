import type { Language } from '../context/language-context-value';

export const onboardingText = {
  ko: {
    badge: 'AI 야드 엔진 온라인',
    headline: '지시 하나로 최적화된 야드 이동 계획을 완성하세요.',
    description:
      '자연어로 입력한 야드 지시를 구조화된 제약 조건으로 변환하고, AI가 생성한 이동 계획을 실시간 전/후 KPI로 검증하세요.',
    partner: '현대글로비스 파트너',
    sync: '실시간 동기화',
    welcomeTitle: '다시 오신 것을 환영합니다',
    welcomeSubtitle: '야드 플래닝 콘솔에 로그인하세요.',
    kakaoButton: '카카오로 로그인',
    termsPrefix: '로그인하면 AutoYard Copilot의',
    termsLink: '이용약관',
    and: '및',
    privacyLink: '개인정보 처리방침',
    termsSuffix: '에 동의하는 것으로 간주됩니다.',
  },
  en: {
    badge: 'AI YARD ENGINE ONLINE',
    headline: 'Turn one instruction into an optimized yard relocation plan.',
    description:
      'Parse natural-language yard instructions into structured constraints, then validate AI-generated relocation plans with real-time before/after KPIs.',
    partner: 'Hyundai Glovis Partner',
    sync: 'Real-time Sync',
    welcomeTitle: 'Welcome Back',
    welcomeSubtitle: 'Sign in to access the yard planning console.',
    kakaoButton: 'Login with Kakao',
    termsPrefix: "By logging in, you agree to AutoYard Copilot's",
    termsLink: 'Terms of Service',
    and: 'and',
    privacyLink: 'Privacy Policy',
    termsSuffix: '.',
  },
} satisfies Record<Language, Record<string, string>>;
