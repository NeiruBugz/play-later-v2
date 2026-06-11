import { RUN_STATUS } from "@/entities/playthrough/model";

import type { RunStatusBadgeProps } from "./run-status-badge.type";

export function RunStatusBadge({ status }: RunStatusBadgeProps) {
  const { label, token, icon: Icon } = RUN_STATUS[status];
  const color = `var(--status-${token})`;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.125rem 0.5rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 500,
        background: `color-mix(in oklch, ${color} 15%, transparent)`,
        color,
      }}
    >
      <Icon
        style={{ width: "0.75rem", height: "0.75rem" }}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}
