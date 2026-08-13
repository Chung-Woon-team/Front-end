import { ClipboardList, Gauge, Grid3x3, Route, Truck } from 'lucide-react';
import { CURRENT_USER_NAME } from '../constants/user';

interface StatCard {
  icon: typeof Truck;
  label: string;
}

const STATS: StatCard[] = [
  { icon: Truck, label: '야드 내 차량' },
  { icon: ClipboardList, label: '승인 대기 제약' },
  { icon: Grid3x3, label: '가용 슬롯' },
  { icon: Route, label: '평균 이동거리' },
];

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

export function DashboardPage() {
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-sm text-neutral-500">{stat.label}</p>
            <p className="mt-0.5 text-xl font-bold text-neutral-900">–</p>
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

          <div className="flex min-h-[220px] items-center justify-center text-sm text-neutral-400">
            연동된 블록 데이터가 없습니다.
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-base font-bold text-neutral-900">최근 활동</h2>
          <div className="flex min-h-[220px] items-center justify-center text-sm text-neutral-400">
            최근 활동 내역이 없습니다.
          </div>
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
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-neutral-400">
                  표시할 지시가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
