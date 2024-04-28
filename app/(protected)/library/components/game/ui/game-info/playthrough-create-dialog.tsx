import { createPlaythrough } from "@/app/(protected)/library/lib/actions/create-playthrough";
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
import { Game } from "@prisma/client";
import { z } from "zod";

const createPlaythroughSchema = z.object({
  createdAt: z.date(),
  deletedAt: z.date().optional().nullable(),
  finishedAt: z.date().optional().nullable(),
  label: z.string().default("Playthrough #1"),
  platform: z.string(),
  startedAt: z.date(),
  updatedAt: z.date().optional().nullable(),
});

export const PlaythroughDialog = ({
  id,
  platforms,
}: {
  id: Game["id"];
  platforms: FullGameInfoResponse["release_dates"];
}) => {
  if (!platforms) {
    return null;
  }

  async function createPlaythroughAction(data: FormData) {
    "use server";
    const payload = {
      createdAt: new Date(),
      finishedAt: data.get("finishedAt")
        ? new Date(data.get("finishedAt") as string)
        : undefined,
      label: data.get("label"),
      platform: data.get("platform"),
      startedAt: data.get("startedAt")
        ? new Date(data.get("startedAt") as string)
        : new Date(),
    };
    const parsed = createPlaythroughSchema.safeParse(payload);

    if (parsed.success) {
      const data = {
        ...{ deletedAt: null, finishedAt: null, updatedAt: null },
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
          action={createPlaythroughAction}
          className="flex flex-col gap-4"
          id="create-playthrough-form"
        >
          <Label>
            Playthrough label
            <Input
              className="mt-2"
              defaultValue="Playthrough #1"
              name="label"
              placeholder="Enter a name for your playthrough"
            />
          </Label>
          <Label>
            Platform of choice
            <Select name="platform">
              <SelectTrigger
                className="mt-2"
                defaultValue={platforms[0].platform.name}
              >
                <SelectValue
                  defaultValue={platforms[0].platform.name}
                  placeholder="Select a platform"
                />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((platform) => {
                  return (
                    <SelectItem
                      key={platform.platform.id}
                      value={platform.platform.name}
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
              <Input className="mt-2" name="startedAt" type="date" />
            </Label>
            <Label className="w-full">
              Finish Date
              <Input className="mt-2" name="finishedAt" type="date" />
            </Label>
          </div>
        </form>
        <DialogFooter>
          <Button form="create-playthrough-form" type="reset">
            Cancel
          </Button>
          <Button form="create-playthrough-form" type="submit">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
