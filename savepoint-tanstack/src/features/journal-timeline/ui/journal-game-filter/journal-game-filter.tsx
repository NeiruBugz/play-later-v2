import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type { JournalGameFilterProps } from "./journal-game-filter.type";

const NO_GAME = "none";

export function JournalGameFilter({
  options,
  value,
  onChange,
}: JournalGameFilterProps) {
  const items = [
    { value: null, label: "All" },
    ...options.map((option) => ({ value: option.id, label: option.title })),
    { value: NO_GAME, label: "No game" },
  ];

  return (
    <Select
      value={value ?? null}
      items={items}
      onValueChange={(next) => onChange(next ?? undefined)}
    >
      <SelectTrigger aria-label="Filter by game" className="w-full md:w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value ?? "all"} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
