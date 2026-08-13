import { NavLink, useNavigate } from 'react-router-dom';
import {
  ChartColumn,
  CircleQuestionMark,
  FileText,
  Grid3x3,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { to: '/instructions', label: '지시 관리', icon: MessageSquareText },
  { to: '/yard', label: '야드 배치', icon: Grid3x3 },
  { to: '/kpi', label: 'KPI', icon: ChartColumn },
  { to: '/briefing', label: '브리핑', icon: FileText },
  { to: '/revisions', label: '리비전 로그', icon: RotateCcw },
  { to: '/settings', label: '설정', icon: Settings },
];

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col bg-primary-950 text-white">
      <div className="flex items-center gap-2.5 px-6 pt-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
          <LayoutGrid className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-semibold leading-tight">AutoYard Copilot</p>
          <p className="text-xs text-white/50">관제 콘솔</p>
        </div>
      </div>

      <nav className="mt-8 flex-1 space-y-1 px-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-secondary-600 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
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
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-600">
              <RefreshCw className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">AI 엔진 상태: 정상</span>
          </div>
          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-white py-2 text-sm font-semibold text-primary-900 hover:bg-white/90"
          >
            자세히 보기
          </button>
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
  );
}
