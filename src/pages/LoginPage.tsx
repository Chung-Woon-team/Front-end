import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { useLanguage } from '../hooks/useLanguage';
import { onboardingText } from '../i18n/onboarding';

const EXIT_TRANSITION_MS = 300;

export function LoginPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const text = onboardingText[language];
  const [isLeaving, setIsLeaving] = useState(false);

  const handleStart = () => {
    if (isLeaving) return;
    setIsLeaving(true);
    window.setTimeout(() => navigate('/dashboard'), EXIT_TRANSITION_MS);
  };

  return (
    <AuthLayout isExiting={isLeaving}>
      <div className="w-full max-w-sm">
        <h2 className="animate-fade-in-up text-2xl font-bold text-neutral-900">{text.welcomeTitle}</h2>
        <p className="mt-1 animate-fade-in-up text-sm text-neutral-500" style={{ animationDelay: '100ms' }}>
          {text.welcomeSubtitle}
        </p>

        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <button
            type="button"
            onClick={handleStart}
            disabled={isLeaving}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-900 bg-neutral-900 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
          >
            {text.startButton}
            <ArrowRight className="h-4 w-4 animate-arrow-nudge" />
          </button>
        </div>

        <p
          className="mt-6 animate-fade-in-up text-center text-xs text-neutral-400"
          style={{ animationDelay: '300ms' }}
        >
          {text.termsPrefix}{' '}
          <a href="#" className="text-neutral-600 underline hover:text-neutral-800">
            {text.termsLink}
          </a>{' '}
          {text.and}{' '}
          <a href="#" className="text-neutral-600 underline hover:text-neutral-800">
            {text.privacyLink}
          </a>
          {text.termsSuffix}
        </p>
      </div>
    </AuthLayout>
  );
}
