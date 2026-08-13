import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, MessageCircle } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // No auth backend yet — routes straight through so the rest of the flow is demoable.
    navigate('/dashboard');
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-neutral-900">Welcome Back</h2>
        <p className="mt-1 text-sm text-neutral-500">Sign in to access the yard planning console.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Company Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="yardmanager@glovis.com"
                className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Password
              </label>
              <a href="#" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            Remember device
          </label>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Sign in to Console
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-xs font-medium tracking-wide text-neutral-400">
            OR CONTINUE WITH
          </span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] py-2.5 text-sm font-semibold text-neutral-900 transition hover:brightness-95"
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
