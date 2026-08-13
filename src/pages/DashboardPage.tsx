import { useEffect, useState } from 'react';
import {
  ClipboardList,
  Gauge,
  Grid3x3,
  Loader2,
  Route,
  TrendingDown,
  TrendingUp,
  Truck,
  Zap,
} from 'lucide-react';
import { fetchDashboard } from '../api/dashboard';
import { CURRENT_USER_NAME } from '../constants/user';
import type { DashboardResponse } from '../types/dashboard';

type Tone = 'good' | 'warn' | 'bad' | 'neutral';

function toneFor(status: string): Tone {
  const s = status.toUpperCase();
  if (s.includes('APPROV') || s.includes('OPERAT') || s.includes('NORMAL') || s.includes('COMPLETE') || s === 'UP')
    return 'good';
  if (s.includes('REJECT') || s.includes('CLOSED') || s.includes('VIOLATION') || s === 'DOWN' || s.includes('FAIL'))
    return 'bad';
  if (s.includes('PENDING') || s.includes('WAIT') || s.includes('HOLD') || s.includes('CONGEST')) return 'warn';
  return 'neutral';
}

const TONE_BADGE_CLASS: Record<Tone, string> = {
  good: 'bg-emerald-50 text-emerald-700',
  bad: 'bg-red-50 text-red-700',
  warn: 'bg-secondary-50 text-secondary-700',
  neutral: 'bg-neutral-100 text-neutral-600',
};

const TONE_ACTIVITY_ICON_CLASS: Record<Tone, string> = {
  good: 'bg-emerald-100 text-emerald-600',
  bad: 'bg-red-100 text-red-600',
  warn: 'bg-secondary-100 text-secondary-600',
  neutral: 'bg-neutral-100 text-neutral-500',
};

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function formatToday(date: Date): string {
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
  return `${get('year')}-${get('month')}-${get('day')} · ${get('hour')}:${get('minute')}`;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.round(hours / 24)}일 전`;
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchDashboard()
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '대시보드 데이터를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = data?.summary;
  const distanceUp = (summary?.avg_move_distance_delta_pct ?? 0) > 0;

  const STATS = [
    {
      icon: Truck,
      label: '야드 내 차량',
      value: summary ? `${summary.vehicles_in_yard}` : '–',
      badge: summary ? `오늘 +${summary.vehicles_arrived_today}` : undefined,
      tone: 'neutral' as Tone,
    },
    {
      icon: ClipboardList,
      label: '승인 대기 제약',
      value: summary ? `${summary.pending_constraints}` : '–',
      badge: summary && summary.pending_constraints > 0 ? '확인 필요' : undefined,
      tone: 'warn' as Tone,
    },
    {
      icon: Grid3x3,
      label: '가용 슬롯',
      value: summary ? `${summary.available_slots} / ${summary.total_slots}` : '–',
      badge: summary?.congestion_label,
      tone: summary ? toneFor(summary.congestion) : 'neutral',
    },
    {
      icon: Route,
      label: '평균 이동거리',
      value: summary?.avg_move_distance_meters !== undefined ? `${summary.avg_move_distance_meters.toFixed(0)}m` : '–',
      badge:
        summary?.avg_move_distance_delta_pct !== undefined
          ? `${distanceUp ? '+' : ''}${summary.avg_move_distance_delta_pct.toFixed(1)}%`
          : undefined,
      tone: (distanceUp ? 'warn' : 'good') as Tone,
      trendIcon: distanceUp ? TrendingUp : TrendingDown,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">안녕하세요, {CURRENT_USER_NAME}님 👋</h1>
          <p className="mt-1 text-sm text-neutral-500">현재 야드 상태를 확인하세요.</p>
        </div>
        <span className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
          {formatToday(new Date())}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <stat.icon className="h-4 w-4" />
              </div>
              {stat.badge && (
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TONE_BADGE_CLASS[stat.tone]}`}
                >
                  {stat.trendIcon && <stat.trendIcon className="h-3 w-3" />}
                  {stat.badge}
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-neutral-500">{stat.label}</p>
            <p className="mt-0.5 text-xl font-bold text-neutral-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900">블록 현황</h2>
              <p className="text-sm text-neutral-500">야드 실시간 상태</p>
            </div>
            <Gauge className="h-5 w-5 text-neutral-300" />
          </div>

          {isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center text-neutral-300">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : data && data.blocks.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.blocks.map((block) => (
                <div key={block.block_id} className="rounded-lg border border-neutral-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-900">{block.block_id}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE_BADGE_CLASS[toneFor(block.status)]}`}
                    >
                      {block.status_label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-500">{block.note}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
                    <span>슬롯 사용</span>
                    <span>
                      {block.occupied} / {block.capacity}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{ width: `${block.capacity > 0 ? Math.round((block.occupied / block.capacity) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-neutral-400">
              연동된 블록 데이터가 없습니다.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-base font-bold text-neutral-900">최근 활동</h2>
          {isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center text-neutral-300">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : data && data.recent_activities.length > 0 ? (
            <div className="mt-4 space-y-4">
              {data.recent_activities.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONE_ACTIVITY_ICON_CLASS[toneFor(activity.type)]}`}
                  >
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{activity.title}</p>
                    <p className="text-sm text-neutral-500">{activity.description}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">{formatRelativeTime(activity.occurred_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-neutral-400">
              최근 활동 내역이 없습니다.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-base font-bold text-neutral-900">최근 지시</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs text-neutral-400">
                <th className="pb-2 font-medium">시간</th>
                <th className="pb-2 font-medium">지시 ID</th>
                <th className="pb-2 font-medium">작성자</th>
                <th className="pb-2 font-medium">요약</th>
                <th className="pb-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-300">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : data && data.recent_instructions.length > 0 ? (
                data.recent_instructions.map((row) => (
                  <tr key={row.instruction_id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-2.5 text-neutral-500">{formatTime(row.created_at)}</td>
                    <td className="py-2.5 font-medium text-neutral-900">{row.instruction_id}</td>
                    <td className="py-2.5 text-neutral-600">{row.author}</td>
                    <td className="py-2.5 text-neutral-600">{row.summary}</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE_BADGE_CLASS[toneFor(row.status)]}`}
                      >
                        {row.status_label}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-neutral-400">
                    표시할 지시가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
