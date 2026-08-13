import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CircleUser, Plus, RefreshCw, RotateCcw, Search, Settings, X } from 'lucide-react';
import { CURRENT_USER_NAME } from '../../constants/user';

function formatAccessTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
}

export function Topbar() {
  const [showAlert, setShowAlert] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [accessTime] = useState(() => formatAccessTime(new Date()));

  return (
    <div className="flex flex-col">
      {showAlert && (
        <div className="flex items-center justify-between gap-3 bg-secondary-50 px-6 py-2.5 text-sm text-secondary-800">
          <span>확인이 필요한 항목이 있습니다. 브리핑에서 세부 내용을 확인하세요.</span>
          <button
            type="button"
            onClick={() => setShowAlert(false)}
            aria-label="배너 닫기"
            className="text-secondary-600 hover:text-secondary-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <header className="flex items-center gap-4 border-b border-neutral-200 bg-white px-6 py-3.5">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="작업, 차량 검색…"
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <div className="flex items-center gap-1 text-neutral-500">
          <button type="button" className="relative rounded-lg p-2 hover:bg-neutral-100" aria-label="알림">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
          <button type="button" className="rounded-lg p-2 hover:bg-neutral-100" aria-label="최근 기록">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-lg p-2 hover:bg-neutral-100" aria-label="동기화">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-neutral-200" />

        <a href="#" className="text-sm font-medium text-neutral-500 hover:text-neutral-700">
          도움말
        </a>

        <Link
          to="/instructions"
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          새 지시 입력
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen((value) => !value)}
            aria-label="계정 메뉴"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-300 hover:text-neutral-400"
          >
            <CircleUser className="h-8 w-8" />
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
                <p className="px-1 text-sm font-semibold text-neutral-900">{CURRENT_USER_NAME}</p>
                <p className="px-1 mt-0.5 text-xs text-neutral-400">{accessTime} 접속</p>
                <div className="my-3 h-px bg-neutral-100" />
                <Link
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  <Settings className="h-4 w-4" />
                  개인정보 수정
                </Link>
              </div>
            </>
          )}
        </div>
      </header>
    </div>
  );
}
