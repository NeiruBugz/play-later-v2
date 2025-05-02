import { getBacklogItems } from "@/features/manage-backlog-item/edit-backlog-item/server-actions/get-backlog-items";
import { Button } from "@/shared/components";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/tabs";
import { BacklogStatusMapper, normalizeString } from "@/shared/lib";
import { PlusIcon } from "lucide-react";
import { CreateBacklogItemForm } from "../../create-backlog-item/components/create-backlog-item-form";
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
        <Button className="my-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700">
          Edit entry
        </Button>
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
