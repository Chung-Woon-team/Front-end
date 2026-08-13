import type { ReactNode } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { onboardingText } from '../../i18n/onboarding';
import logoHdg from '../../assets/logo_HDG.webp';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { language, toggleLanguage } = useLanguage();
  const text = onboardingText[language];

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-neutral-50">
      <button
        type="button"
        onClick={toggleLanguage}
        aria-label="Toggle language"
        className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 shadow-sm transition hover:bg-neutral-50 lg:right-6 lg:top-6"
      >
        <span className={language === 'ko' ? 'text-primary-600' : 'text-neutral-400'}>한글</span>
        <span className="text-neutral-300">/</span>
        <span className={language === 'en' ? 'text-primary-600' : 'text-neutral-400'}>EN</span>
      </button>

      <div
        className="relative hidden w-[54%] flex-col overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-700 px-16 py-12 text-white lg:flex"
        style={{ clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0 100%)' }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative flex items-center gap-3">
          <img src={logoHdg} alt="Hyundai Glovis" className="h-7 w-auto brightness-0 invert" />
          <span className="text-lg font-semibold tracking-tight">AutoYard Copilot</span>
        </div>

        <div className="relative flex flex-1 flex-col items-start justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {text.badge}
          </span>
          <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight">{text.headline}</h1>
          <p className="mt-4 max-w-sm text-sm text-white/70">{text.description}</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6">{children}</div>
    </div>
  );
}
