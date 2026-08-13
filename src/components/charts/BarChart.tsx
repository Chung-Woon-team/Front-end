interface BarChartRow {
  label: string;
  value: number;
}

interface BarChartProps {
  rows: BarChartRow[];
  color: string;
  formatValue?: (value: number) => string;
  maxRows?: number;
}

export function BarChart({ rows, color, formatValue = (value) => `${value}`, maxRows = 12 }: BarChartProps) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-400">표시할 데이터가 없습니다.</p>;
  }

  const visible = rows.slice(0, maxRows);
  const max = Math.max(1, ...visible.map((row) => row.value));

  return (
    <div className="space-y-2.5">
      {visible.map((row) => {
        const pct = Math.max(2, Math.round((row.value / max) * 100));
        return (
          <div key={row.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-xs text-neutral-500" title={row.label}>
              {row.label}
            </span>
            <div className="flex-1 py-1">
              <div className="group/bar relative h-4" style={{ width: `${pct}%` }}>
                <div
                  className="h-4 w-full"
                  style={{ backgroundColor: color, borderTopRightRadius: 4, borderBottomRightRadius: 4 }}
                />
                <div className="pointer-events-none absolute -top-8 left-0 z-10 hidden whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white group-hover/bar:block">
                  {row.label}: {formatValue(row.value)}
                </div>
              </div>
            </div>
            <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums text-neutral-900">
              {formatValue(row.value)}
            </span>
          </div>
        );
      })}
      {rows.length > maxRows && <p className="pt-1 text-xs text-neutral-400">외 {rows.length - maxRows}건</p>}
    </div>
  );
}
