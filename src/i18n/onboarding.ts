import type { Language } from '../context/language-context-value';

export const onboardingText = {
  ko: {
    badge: 'AI 야드 엔진 온라인',
    headline: '지시 하나로 최적화된 야드 이동 계획을 완성하세요.',
    description:
      '자연어로 입력한 야드 지시를 구조화된 제약 조건으로 변환하고, AI가 생성한 이동 계획을 실시간 전/후 KPI로 검증하세요.',
    welcomeTitle: '환영합니다',
    welcomeSubtitle: '야드 플래닝 콘솔을 시작해보세요.',
    startButton: '시작하기',
    termsPrefix: '시작하면 AutoYard Copilot의',
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
    welcomeTitle: 'Welcome',
    welcomeSubtitle: 'Get started with the yard planning console.',
    startButton: 'Get Started',
    termsPrefix: "By getting started, you agree to AutoYard Copilot's",
    termsLink: 'Terms of Service',
    and: 'and',
    privacyLink: 'Privacy Policy',
    termsSuffix: '.',
  },
} satisfies Record<Language, Record<string, string>>;