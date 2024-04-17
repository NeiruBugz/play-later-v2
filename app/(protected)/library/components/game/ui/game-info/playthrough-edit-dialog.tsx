import { Game } from "@prisma/client";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
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

import { getPlaythrough } from "@/app/(protected)/library/lib/actions/get-playthrough";
import { updatePlaythrough } from "@/app/(protected)/library/lib/actions/update-playthrough";

const editPlaythroughSchema = z.object({
  label: z.string().default("Playthrough #1"),
  platform: z.string(),
  startedAt: z.date(),
  finishedAt: z.date().optional(),
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
        <Button size="icon" variant="outline" className="flex-shrink-0">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Edit a Playthrough</DialogTitle>
        <form
          className="flex flex-col gap-4"
          action={editPlaythroughAction}
          id="create-playthrough-form"
        >
          <Label>
            Playthrough label
            <Input
              name="label"
              placeholder="Enter a name for your playthrough"
              defaultValue={data.label}
              className="mt-2"
            />
          </Label>
          <Label>
            Platform of choice
            <Select name="platform" defaultValue={data.platform}>
              <SelectTrigger className="mt-2">
                <SelectValue
                  placeholder="Select a platform"
                  defaultValue={data.platform}
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
              <Input
                type="date"
                name="startedAt"
                className="mt-2"
                defaultValue={format(data.startedAt, "yyyy-MM-dd")}
              />
            </Label>
            <Label className="w-full">
              Finish Date
              <Input
                type="date"
                name="finishedAt"
                className="mt-2"
                defaultValue={
                  data.finishedAt
                    ? format(data.finishedAt, "yyyy-MM-dd")
                    : undefined
                }
              />
            </Label>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="create-playthrough-form">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
