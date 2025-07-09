import { BacklogItem, BacklogItemStatus } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { editBacklogItem } from "@/features/manage-backlog-item/edit-backlog-item/server-actions/action";
import { createBacklogItem } from "@/features/manage-backlog-item/edit-backlog-item/server-actions/create-backlog-item";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { BacklogStatusMapper, playingOnPlatforms } from "@/shared/lib";

type GameEntryFormProps = Pick<
  BacklogItem,
  "startedAt" | "completedAt" | "platform" | "status" | "id"
> & {
  gameId?: string;
};

const isValidStatus = (value: string): value is BacklogItemStatus => {
  return Object.values(BacklogItemStatus).includes(value as BacklogItemStatus);
};

export function GameEntryForm({
  status,
  startedAt,
  platform,
  completedAt,
  id,
  gameId,
}: GameEntryFormProps) {
  const [playStatus, setPlayStatus] = useState(status);
  const [entryPlatform, setEntryPlatform] = useState(platform || "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    startedAt || undefined
  );
  const [completionDate, setCompletionDate] = useState<Date | undefined>(
    completedAt || undefined
  );

  const onSubmit = async () => {
    const formData = new FormData();
    formData.append("status", playStatus);
    formData.append("platform", entryPlatform);
    formData.append("id", id.toString());
    if (startDate) {
      formData.append("startedAt", startDate.toString());
    }
    if (completionDate) {
      formData.append("completedAt", completionDate.toString());
    }
    try {
      if (id === 0) {
        if (gameId) {
          formData.append("gameId", gameId);
        }
        await createBacklogItem(formData);
      } else {
        await editBacklogItem(formData);
      }
      toast.success("Backlog item updated successfully");
    } catch (error) {
      console.error("Error updating backlog item:", error);
      toast.error("Failed to update backlog item");
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="playStatus">Play Status</Label>
        <Select
          name="playStatus"
          value={playStatus}
          onValueChange={(value) => {
            if (isValidStatus(value)) {
              setPlayStatus(value as unknown as BacklogItemStatus);
            }
          }}
        >
          <SelectTrigger id="playStatus">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(BacklogItemStatus).map((key) => (
              <SelectItem value={key} key={key}>
                {BacklogStatusMapper[key as unknown as BacklogItemStatus]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="platform">Platform</Label>
        <Select
          value={entryPlatform}
          onValueChange={setEntryPlatform}
          name="platform"
        >
          <SelectTrigger id="platform">
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            {playingOnPlatforms.map((platform) => (
              <SelectItem value={platform.value} key={platform.value}>
                {platform.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-2">
          <Label>Completion Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {completionDate ? format(completionDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={completionDate}
                onSelect={setCompletionDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button onClick={onSubmit}>Save changes</Button>
      </div>
    </div>
  );
}
