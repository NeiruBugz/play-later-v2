import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type { JournalGameFilterProps } from "./journal-game-filter.type";

const NO_GAME = "none";
const ALL_GAMES = "all";

export function JournalGameFilter({
  options,
  value,
  onChange,
}: JournalGameFilterProps) {
  const items = [
    { value: ALL_GAMES, label: "All" },
    ...options.map((option) => ({ value: option.id, label: option.title })),
    { value: NO_GAME, label: "No game" },
  ];

  return (
    <Select
      value={value ?? ALL_GAMES}
      items={items}
      onValueChange={(next) =>
        onChange(next === null || next === ALL_GAMES ? undefined : next)
      }
    >
      <SelectTrigger aria-label="Filter by game" className="w-full md:w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
