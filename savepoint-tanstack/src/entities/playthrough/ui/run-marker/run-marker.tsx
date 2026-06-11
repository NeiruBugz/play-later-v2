import { RUN_STATUS } from "@/entities/playthrough/model";

import type { RunMarkerProps } from "./run-marker.type";

export function RunMarker({ status, size = 30, ring = false }: RunMarkerProps) {
  const token = RUN_STATUS[status].token;
  const color = `var(--status-${token})`;
  const half = size / 2;

  return (
    <span
      data-testid="run-marker"
      data-status={status}
      style={{
        display: "inline-flex",
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {ring ? (
        <span
          data-testid="run-marker-halo"
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            background: `color-mix(in oklch, ${color} 20%, transparent)`,
          }}
        />
      ) : null}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* outer stroked rect — rotated 45° diamond */}
        <rect
          x={half * 0.25}
          y={half * 0.25}
          width={half * 1.5}
          height={half * 1.5}
          rx={size * 0.06}
          transform={`rotate(45, ${half}, ${half})`}
          fill="var(--card)"
          stroke={color}
          strokeWidth={size * 0.08}
        />
        {/* inner filled rect for brand fill */}
        <rect
          x={half * 0.5}
          y={half * 0.5}
          width={half * 1.0}
          height={half * 1.0}
          rx={size * 0.04}
          transform={`rotate(45, ${half}, ${half})`}
          fill={color}
        />
      </svg>
    </span>
  );
}
