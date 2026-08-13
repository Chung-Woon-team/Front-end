import {
  CircleCheckBig,
  ClipboardList,
  Gauge,
  Grid3x3,
  LogIn,
  Route,
  TrendingDown,
  TrendingUp,
  Truck,
  Zap,
} from 'lucide-react';
import { CURRENT_USER_NAME } from '../constants/user';

interface StatCard {
  icon: typeof Truck;
  label: string;
  value: string;
  badge: string;
  badgeTone: 'up' | 'down' | 'warn' | 'neutral';
}

const STATS: StatCard[] = [
  { icon: Truck, label: '야드 내 차량', value: '482', badge: '+12%', badgeTone: 'up' },
  { icon: ClipboardList, label: '승인 대기 제약', value: '3', badge: '오늘', badgeTone: 'neutral' },
  { icon: Grid3x3, label: '가용 슬롯', value: '312 / 1,936', badge: '혼잡', badgeTone: 'warn' },
  { icon: Route, label: '평균 이동거리', value: '482m', badge: '-12%', badgeTone: 'down' },
];

interface BlockStatus {
  blockId: string;
  status: '운영 중' | '폐쇄됨' | '재배치 중';
  occupied: number;
  capacity: number;
  note: string;
}

const BLOCKS: BlockStatus[] = [
  { blockId: 'B01', status: '운영 중', occupied: 312, capacity: 484, note: '차량 3대 입고' },
  { blockId: 'B02', status: '폐쇄됨', occupied: 0, capacity: 484, note: '도색작업으로 폐쇄' },
  { blockId: 'B03', status: '운영 중', occupied: 118, capacity: 484, note: '변동 없음' },
  { blockId: 'B04', status: '재배치 중', occupied: 76, capacity: 484, note: '16대 이동 진행' },
];

interface ActivityItem {
  icon: typeof CircleCheckBig;
  tone: 'good' | 'primary' | 'neutral';
  title: string;
  description: string;
  time: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    icon: CircleCheckBig,
    tone: 'good',
    title: '제약 승인됨',
    description: 'C-001 블록 폐쇄 제약이 승인되었습니다.',
    time: '10분 전',
  },
  {
    icon: Zap,
    tone: 'primary',
    title: '재배치 실행됨',
    description: 'B02 블록 재배치 16대 완료.',
    time: '35분 전',
  },
  {
    icon: LogIn,
    tone: 'neutral',
    title: '지시 접수',
    description: '새 지시가 입력되었습니다 (INS-004).',
    time: '방금 전',
  },
];

interface RecentInstruction {
  time: string;
  instructionId: string;
  author: string;
  summary: string;
  status: '승인됨' | '승인 대기' | '반려됨';
}

const RECENT_INSTRUCTIONS: RecentInstruction[] = [
  { time: '09:12', instructionId: 'INS-001', author: '야드관리자A', summary: 'B02 블록 도색작업 폐쇄', status: '승인됨' },
  { time: '08:47', instructionId: 'INS-002', author: '야드관리자B', summary: '철도 출고 차량 동쪽 구역 배치', status: '승인 대기' },
  { time: '08:20', instructionId: 'INS-003', author: '야드관리자A', summary: '컷오프 차량 게이트 우선 배치', status: '승인됨' },
  { time: '07:55', instructionId: 'INS-004', author: '야드관리자C', summary: 'B01 블록 임시 폐쇄 요청', status: '반려됨' },
];

const BADGE_TONE_CLASS: Record<StatCard['badgeTone'], string> = {
  up: 'bg-emerald-50 text-emerald-700',
  down: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-secondary-50 text-secondary-700',
  neutral: 'bg-neutral-100 text-neutral-600',
};

const BLOCK_STATUS_CLASS: Record<BlockStatus['status'], string> = {
  '운영 중': 'bg-emerald-50 text-emerald-700',
  폐쇄됨: 'bg-red-50 text-red-700',
  '재배치 중': 'bg-secondary-50 text-secondary-700',
};

const ACTIVITY_TONE_CLASS: Record<ActivityItem['tone'], string> = {
  good: 'bg-emerald-100 text-emerald-600',
  primary: 'bg-primary-100 text-primary-600',
  neutral: 'bg-neutral-100 text-neutral-500',
};

const INSTRUCTION_STATUS_CLASS: Record<RecentInstruction['status'], string> = {
  승인됨: 'bg-emerald-50 text-emerald-700',
  '승인 대기': 'bg-secondary-50 text-secondary-700',
  반려됨: 'bg-red-50 text-red-700',
};

export function DashboardPage() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">안녕하세요, {CURRENT_USER_NAME}님 👋</h1>
          <p className="mt-1 text-sm text-neutral-500">현재 야드 상태를 확인하세요.</p>
        </div>
        <span className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
          2026-08-13 · 08:45
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <stat.icon className="h-4 w-4" />
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_TONE_CLASS[stat.badgeTone]}`}
              >
                {stat.badgeTone === 'up' && <TrendingUp className="h-3 w-3" />}
                {stat.badgeTone === 'down' && <TrendingDown className="h-3 w-3" />}
                {stat.badge}
              </span>
            </div>
            <p className="mt-3 text-sm text-neutral-500">{stat.label}</p>
            <p className="mt-0.5 text-xl font-bold text-neutral-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900">블록 현황</h2>
              <p className="text-sm text-neutral-500">야드 실시간 상태</p>
            </div>
            <Gauge className="h-5 w-5 text-neutral-300" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {BLOCKS.map((block) => (
              <div key={block.blockId} className="rounded-lg border border-neutral-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-900">{block.blockId}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${BLOCK_STATUS_CLASS[block.status]}`}
                  >
                    {block.status}
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
                    style={{ width: `${Math.round((block.occupied / block.capacity) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-base font-bold text-neutral-900">최근 활동</h2>
          <div className="mt-4 space-y-4">
            {ACTIVITIES.map((activity, index) => (
              <div key={index} className="flex gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ACTIVITY_TONE_CLASS[activity.tone]}`}
                >
                  <activity.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{activity.title}</p>
                  <p className="text-sm text-neutral-500">{activity.description}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{activity.time}</p>
                </div>
              </div>
            ))}
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
              {RECENT_INSTRUCTIONS.map((row) => (
                <tr key={row.instructionId} className="border-b border-neutral-100 last:border-0">
                  <td className="py-2.5 text-neutral-500">{row.time}</td>
                  <td className="py-2.5 font-medium text-neutral-900">{row.instructionId}</td>
                  <td className="py-2.5 text-neutral-600">{row.author}</td>
                  <td className="py-2.5 text-neutral-600">{row.summary}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${INSTRUCTION_STATUS_CLASS[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
