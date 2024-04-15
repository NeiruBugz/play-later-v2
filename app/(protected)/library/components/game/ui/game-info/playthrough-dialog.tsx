import { Game } from "@prisma/client";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FullGameInfoResponse } from "@/lib/types/igdb";

import { createPlaythrough } from "@/app/(protected)/library/lib/actions/create-playthrough";

const createPlaythroughSchema = z.object({
  label: z.string().default("Playthrough #1"),
  platform: z.string(),
  startedAt: z.date(),
  finishedAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().optional().nullable(),
  deletedAt: z.date().optional().nullable(),
});

export const PlaythroughDialog = ({
  id,
  platforms,
}: {
  id: Game["id"];
  platforms: FullGameInfoResponse["release_dates"];
}) => {
  async function createPlaythroughAction(data: FormData) {
    "use server";
    const payload = {
      label: data.get("label"),
      platform: data.get("platform"),
      startedAt: data.get("startedAt")
        ? new Date(data.get("startedAt") as string)
        : new Date(),
      finishedAt: data.get("finishedAt")
        ? new Date(data.get("finishedAt") as string)
        : undefined,
      createdAt: new Date(),
    };
    const parsed = createPlaythroughSchema.safeParse(payload);

    if (parsed.success) {
      const data = {
        ...{ finishedAt: null, updatedAt: null, deletedAt: null },
        ...parsed.data,
      };
      await createPlaythrough({ gameId: id, payload: data });
    } else {
      console.log(parsed.error);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add a Playthrough</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add a Playthrough</DialogTitle>
        <form
          className="flex flex-col gap-4"
          action={createPlaythroughAction}
          id="create-playthrough-form"
        >
          <Label>
            Playthrough label
            <Input
              name="label"
              placeholder="Enter a name for your playthrough"
              defaultValue="Playthrough #1"
              className="mt-2"
            />
          </Label>
          <Label>
            Platform of choice
            <Select name="platform">
              <SelectTrigger className="mt-2">
                <SelectValue
                  placeholder="Select a platform"
                  defaultValue={platforms[0].platform.name}
                />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((platform) => {
                  return (
                    <SelectItem
                      value={platform.platform.name}
                      key={platform.platform.id}
                    >
                      {platform.platform.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </Label>
          <div className="flex justify-between gap-4">
            <Label className="w-full">
              Start Date
              <Input type="date" name="startedAt" className="mt-2" />
            </Label>
            <Label className="w-full">
              Finish Date
              <Input type="date" name="finishedAt" className="mt-2" />
            </Label>
          </div>
        </form>
        <DialogFooter>
          <Button type="reset" form="create-playthrough-form">
            Cancel
          </Button>
          <Button type="submit" form="create-playthrough-form">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
