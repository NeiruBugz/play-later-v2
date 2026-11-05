import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type { JournalGameFilterProps } from "./journal-game-filter.type";

const ALL_NOTES = "all";
const NO_GAME = "none";

export function JournalGameFilter({
  options,
  value,
  onChange,
}: JournalGameFilterProps) {
  return (
    <Select
      value={value ?? ALL_NOTES}
      onValueChange={(next) => onChange(next === ALL_NOTES ? undefined : next)}
    >
      <SelectTrigger aria-label="Filter by game" className="w-full md:w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_NOTES}>All</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.title}
          </SelectItem>
        ))}
        <SelectItem value={NO_GAME}>No game</SelectItem>
      </SelectContent>
    </Select>
  );
}
