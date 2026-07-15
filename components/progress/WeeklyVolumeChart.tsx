export function WeeklyVolumeChart({ data }: { data: number[] }) {
  const peak = Math.max(...data, 1);
  const heights = data.map((value) => Math.round((value / peak) * 100));

  return (
    <div>
      <div className="mb-2.5 text-[13px] font-bold text-ink/55">Weekly volume</div>
      <div className="mb-5 flex h-20 items-end gap-2 border-b-[1.5px] border-ink/15 pb-0.5">
        {heights.map((height, i) => {
          const isPeak = height > 0 && height === Math.max(...heights);
          return (
            <div
              key={i}
              className={`flex-1 rounded-t ${isPeak ? "bg-volt" : "bg-ink/10"}`}
              style={{ height: `${height}%` }}
              role="img"
              aria-label={`Day ${i + 1}: ${height}% of peak weekly volume`}
            />
          );
        })}
      </div>
    </div>
  );
}
