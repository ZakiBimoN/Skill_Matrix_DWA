interface LevelIconProps {
  level: number;
  size?: number;
  outlineOnly?: boolean;
}

export default function LevelIcon({
  level,
  size = 18,
  outlineOnly = false,
}: LevelIconProps) {
  const cells = [0, 1, 2, 3];
  const gap = 2;
  const cellSize = (size - gap) / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {cells.map((i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const filled = i < level;

        let className: string;
        if (outlineOnly) {
          className = filled
            ? "fill-blue-300 stroke-blue-300"
            : "fill-none stroke-blue-200";
        } else {
          className = filled ? "fill-blue-700" : "fill-slate-200";
        }

        return (
          <rect
            key={i}
            x={col * (cellSize + gap)}
            y={row * (cellSize + gap)}
            width={cellSize}
            height={cellSize}
            rx={1.5}
            className={className}
            strokeWidth={outlineOnly ? 1 : 0}
          />
        );
      })}
    </svg>
  );
}