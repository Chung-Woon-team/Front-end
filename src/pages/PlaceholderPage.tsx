interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white text-center">
      <p className="text-sm font-medium text-neutral-500">{title}</p>
      <p className="mt-1 text-xs text-neutral-400">이 화면은 아직 준비 중입니다.</p>
    </div>
  );
}
