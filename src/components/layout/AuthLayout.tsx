import type { ReactNode } from 'react';
import { Activity, LayoutGrid, ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-50">
      <div
        className="relative hidden w-[54%] flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-700 px-16 py-12 text-white lg:flex"
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">AutoYard Copilot</span>
        </div>

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            AI YARD ENGINE ONLINE
          </span>
          <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight">
            Turn one instruction into an optimized yard relocation plan.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            Parse natural-language yard instructions into structured constraints, then validate
            AI-generated relocation plans with real-time before/after KPIs.
          </p>
        </div>

        <div className="relative flex items-center gap-6 text-xs text-white/60">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Hyundai Glovis Partner
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            Real-time Sync
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6">{children}</div>
    </div>
  );
}
