import type { FullGameInfoResponse } from "@/src/packages/types/igdb";
import type { Game } from "@prisma/client";

import { getPlaythrough } from "@/src/actions/library/get-playthrough";
import { updatePlaythrough } from "@/src/actions/library/update-playthrough";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { processPlaythroughPayload } from "@/src/packages/utils";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { z } from "zod";

const editPlaythroughSchema = z.object({
  finishedAt: z.date().optional(),
  label: z.string().default("Playthrough #1"),
  platform: z.string(),
  startedAt: z.date(),
});

export const PlaythroughEditDialog = async ({
  id,
  platforms,
}: {
  id: Game["id"];
  platforms: FullGameInfoResponse["release_dates"];
}) => {
  const data = await getPlaythrough({ id });

  if (!data) {
    return null;
  }

  async function editPlaythroughAction(data: FormData) {
    "use server";
    const payload = processPlaythroughPayload(data);
    const parsed = editPlaythroughSchema.safeParse(payload);

    if (parsed.success) {
      const data = {
        ...parsed.data,
        ...{ id },
      };
      await updatePlaythrough({ payload: data });
    } else {
      console.log(parsed.error);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex-shrink-0" size="icon" variant="outline">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Edit a Playthrough</DialogTitle>
        <form
          action={editPlaythroughAction}
          className="flex flex-col gap-4"
          id="create-playthrough-form"
        >
          <Label>
            Playthrough label
            <Input
              className="mt-2"
              defaultValue={data.label}
              name="label"
              placeholder="Enter a name for your playthrough"
            />
          </Label>
          <Label>
            Platform of choice
            <Select defaultValue={data.platform} name="platform">
              <SelectTrigger className="mt-2">
                <SelectValue
                  defaultValue={data.platform}
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
              <Input
                className="mt-2"
                defaultValue={format(data.startedAt, "yyyy-MM-dd")}
                name="startedAt"
                type="date"
              />
            </Label>
            <Label className="w-full">
              Finish Date
              <Input
                className="mt-2"
                defaultValue={
                  data.finishedAt
                    ? format(data.finishedAt, "yyyy-MM-dd")
                    : undefined
                }
                name="finishedAt"
                type="date"
              />
            </Label>
          </div>
        </form>
        <DialogFooter>
          <Button form="create-playthrough-form" type="submit">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
