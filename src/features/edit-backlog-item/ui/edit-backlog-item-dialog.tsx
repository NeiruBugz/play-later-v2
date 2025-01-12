import { getBacklogItems } from "@/features/backlog/actions";
import { CreateBacklogItemForm } from "@/src/features/edit-backlog-item/ui/create-backlog-item-form";
import { BacklogStatusMapper, normalizeString } from "@/src/shared/lib";
import { Button } from "@/src/shared/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/shared/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/shared/ui/tabs";
import { PlusIcon } from "lucide-react";
import { EditBacklogItemForm } from "./edit-backlog-item-form";

export async function EditBacklogItemDialog({
  gameId,
  igdbId,
  gameTitle,
}: {
  gameId: string;
  igdbId: number;
  gameTitle: string;
}) {
  const backlogEntries = await getBacklogItems({ gameId });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="my-2">Edit entry</Button>
      </DialogTrigger>
      <DialogContent className="max-w-fit">
        <DialogHeader>
          <DialogTitle>{gameTitle}</DialogTitle>
          <DialogDescription>
            Make changes to your backlog entry.
          </DialogDescription>
        </DialogHeader>
        <div className="my-3">
          <Tabs>
            <TabsList>
              {backlogEntries.map((entry) => {
                return (
                  <TabsTrigger key={entry.id} value={entry.id.toString()}>
                    {BacklogStatusMapper[entry.status]} -{" "}
                    {normalizeString(entry.platform)}
                  </TabsTrigger>
                );
              })}
              <TabsTrigger value="addNew">
                <PlusIcon />
              </TabsTrigger>
            </TabsList>
            {backlogEntries.map((entry) => {
              return (
                <TabsContent key={entry.id} value={entry.id.toString()}>
                  <EditBacklogItemForm
                    entryId={entry.id}
                    platform={entry.platform ?? ""}
                    status={entry.status}
                    startedAt={entry.startedAt}
                    completedAt={entry.completedAt}
                  />
                </TabsContent>
              );
            })}
            <TabsContent value="addNew">
              <CreateBacklogItemForm gameId={gameId} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
