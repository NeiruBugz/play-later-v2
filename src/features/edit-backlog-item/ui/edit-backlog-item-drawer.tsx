import { getBacklogItems } from "@/src/entities/backlog-item";
import { EditDrawerContent } from "@/src/features/edit-backlog-item/ui/drawer-content";
import { Button } from "@/src/shared/ui";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/src/shared/ui/drawer";

export async function EditBacklogItemDrawer({
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
    <Drawer>
      <DrawerTrigger asChild>
        <Button className="my-2 w-full md:hidden">Edit entry</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>{gameTitle}</DrawerTitle>
            <DrawerDescription>
              Make changes to your backlog entry.
            </DrawerDescription>
          </DrawerHeader>
          <EditDrawerContent entries={backlogEntries} gameId={gameId} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
