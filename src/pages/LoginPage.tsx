import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';

export function LoginPage() {
  const navigate = useNavigate();

  const handleKakaoLogin = () => {
    // No auth backend yet — routes straight through so the rest of the flow is demoable.
    navigate('/dashboard');
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-neutral-900">Welcome Back</h2>
        <p className="mt-1 text-sm text-neutral-500">Sign in to access the yard planning console.</p>

        <button
          type="button"
          onClick={handleKakaoLogin}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] py-2.5 text-sm font-semibold text-neutral-900 transition hover:brightness-95"
        >
          <MessageCircle className="h-4 w-4" />
          Login with Kakao
        </button>

        <p className="mt-6 text-center text-xs text-neutral-400">
          By logging in, you agree to AutoYard Copilot&apos;s{' '}
          <a href="#" className="text-neutral-600 underline hover:text-neutral-800">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-neutral-600 underline hover:text-neutral-800">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </AuthLayout>
  );
}
