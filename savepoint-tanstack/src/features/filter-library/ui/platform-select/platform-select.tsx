import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type { PlatformSelectProps } from "./platform-select.type";

export function PlatformSelect({
  value,
  platforms,
  rawPlatform,
  onChange,
}: PlatformSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Platform" className="h-9 w-full">
        <SelectValue placeholder="All platforms" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All platforms</SelectItem>
        {platforms.map((p) => (
          <SelectItem key={p} value={p}>
            {p}
          </SelectItem>
        ))}
        {rawPlatform !== undefined && !platforms.includes(rawPlatform) ? (
          <SelectItem value={rawPlatform}>{rawPlatform}</SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  );
}
