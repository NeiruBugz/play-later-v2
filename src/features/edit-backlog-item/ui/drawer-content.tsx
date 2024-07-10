"use client";

import { CreateBacklogItemForm } from "@/src/features/edit-backlog-item/ui/create-backlog-item-form";
import { EditBacklogItemForm } from "@/src/features/edit-backlog-item/ui/edit-backlog-item-form";
import { BacklogStatusMapper, normalizeString } from "@/src/shared/lib";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/ui";
import { Label } from "@/src/shared/ui/label";
import { BacklogItem } from "@prisma/client";
import { useMemo, useState } from "react";

export function EditDrawerContent({
  entries,
  gameId,
}: {
  entries: BacklogItem[];
  gameId: string;
}) {
  const optionsFromEntries = entries.map((entry) => ({
    value: entry.id,
    label: `${BacklogStatusMapper[entry.status]} - ${normalizeString(entry.platform)}`,
  }));
  const [activeEntry, setActiveEntry] = useState(entries[0].id);

  const activeEntryValues = useMemo(() => {
    if (activeEntry === 0) {
      return undefined;
    }

    return entries.find((entry) => entry.id === activeEntry);
  }, [activeEntry, entries]);

  return (
    <div className="p-4 pb-0">
      <Label>Active entry</Label>
      <Select
        name="status"
        value={activeEntry.toString()}
        onValueChange={(value) => setActiveEntry(Number(value))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a status" className="mt-2" />
        </SelectTrigger>
        <SelectContent>
          {optionsFromEntries.map(({ value, label }) => (
            <SelectItem value={value.toString()} key={value}>
              {label}
            </SelectItem>
          ))}
          <SelectItem value="0">Add new</SelectItem>
        </SelectContent>
      </Select>
      <div className="mt-4 mb-20">
        {activeEntry === 0 ? (
          <CreateBacklogItemForm gameId={gameId} />
        ) : (
          <EditBacklogItemForm
            entryId={activeEntry}
            platform={activeEntryValues?.platform ?? ""}
            status={activeEntryValues?.status ?? "TO_PLAY"}
            startedAt={activeEntryValues?.startedAt}
            completedAt={activeEntryValues?.completedAt}
          />
        )}
      </div>
    </div>
  );
}
