import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type { PlatformSelectProps } from "./platform-select.type";

const ALL_PLATFORMS = "__all__";
const ALL_PLATFORMS_LABEL = "All platforms";

export function PlatformSelect({
  value,
  platforms,
  rawPlatform,
  onChange,
}: PlatformSelectProps) {
  const hasUnknownPlatform =
    rawPlatform !== undefined && !platforms.includes(rawPlatform);
  const items = [
    { value: null, label: ALL_PLATFORMS_LABEL },
    ...platforms.map((p) => ({ value: p, label: p })),
    ...(hasUnknownPlatform ? [{ value: rawPlatform, label: rawPlatform }] : []),
  ];

  return (
    <Select
      value={value === ALL_PLATFORMS ? null : value}
      items={items}
      onValueChange={(next) => onChange(next ?? ALL_PLATFORMS)}
    >
      <SelectTrigger aria-label="Platform" className="h-9 w-full">
        <SelectValue placeholder={ALL_PLATFORMS_LABEL} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value ?? ALL_PLATFORMS} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
