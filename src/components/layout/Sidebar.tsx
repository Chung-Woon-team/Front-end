import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChartColumn,
  CircleQuestionMark,
  FileText,
  Grid3x3,
  Home,
  LogOut,
  MessageSquareText,
} from 'lucide-react';
import logoHdg from '../../assets/img/logo_HDG.webp';
import { fetchDashboard } from '../../api/dashboard';
import type { DashboardAiEngine } from '../../types/dashboard';

// 리비전 로그·설정은 아직 기능 개발 전이라 사이드바에서만 숨긴다 (라우트 자체는 유지).
const NAV_ITEMS = [
  { to: '/dashboard', label: '대시보드', icon: Home },
  { to: '/instructions', label: '지시 관리', icon: MessageSquareText },
  { to: '/yard', label: '야드 배치', icon: Grid3x3 },
  { to: '/kpi', label: 'KPI', icon: ChartColumn },
  { to: '/briefing', label: '브리핑', icon: FileText },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null);
  const [aiEngine, setAiEngine] = useState<DashboardAiEngine | null>(null);

  useEffect(() => {
    const active = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to));
    const el = active ? itemRefs.current[active.to] : null;
    setIndicator(el ? { top: el.offsetTop, height: el.offsetHeight } : null);
  }, [location.pathname]);

  useEffect(() => {
    fetchDashboard()
      .then((data) => setAiEngine(data.ai_engine))
      .catch(() => {
        // Sidebar status is decorative — silently keep the "확인 중" fallback on failure.
      });
  }, []);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 flex-col bg-primary-950 text-white transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-6 pt-6">
          <img src={logoHdg} alt="Hyundai Glovis" className="h-5 w-auto shrink-0 brightness-0 invert" />
          <div>
            <p className="whitespace-nowrap text-base font-semibold leading-tight">AutoYard Copilot</p>
            <p className="text-xs text-white/50">관제 콘솔</p>
          </div>
        </div>

        <nav className="relative mt-8 flex-1 space-y-1 px-4">
          {indicator && (
            <div
              className="absolute left-4 right-4 rounded-lg bg-secondary-600 transition-[transform,height] duration-300 ease-out"
              style={{ transform: `translateY(${indicator.top}px)`, height: indicator.height }}
              aria-hidden="true"
            />
          )}
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              ref={(el) => {
                itemRefs.current[to] = el;
              }}
              onClick={onClose}
              className={({ isActive }) =>
                `relative z-10 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4">
          <div className="rounded-xl bg-white/10 p-4">
            <div className="flex items-center gap-2.5">
              <div
                className={`h-8 w-8 shrink-0 rounded-full ${
                  !aiEngine ? 'bg-white/20' : aiEngine.status.toUpperCase() === 'UP' ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm font-medium">AI 엔진 상태: {aiEngine?.status_label ?? '확인 중'}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-1 border-t border-white/10 px-4 py-4">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white"
          >
            <CircleQuestionMark className="h-4 w-4" />
            도움말
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </aside>
    </>
  );
}
