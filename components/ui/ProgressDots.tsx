interface ProgressBarProps {
  total: number;
  current: number;
  activeClassName?: string;
  trackClassName?: string;
}

export function ProgressBar({
  total,
  current,
  activeClassName = "bg-volt",
  trackClassName = "bg-ink/10",
}: ProgressBarProps) {
  return (
    <div className="flex gap-1.5" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`h-1.5 flex-1 rounded-full ${index < current ? activeClassName : trackClassName}`}
        />
      ))}
    </div>
  );
}
