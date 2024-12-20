import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/shared/ui/alert-dialog";
import { IgdbImage } from "@/src/shared/ui/igdb-image";

export function ScreenshotModal({
  imageId,
  gameName,
}: {
  imageId: string;
  gameName: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <li className="w-full">
          <IgdbImage
            alt={`${gameName} screenshot`}
            className="h-auto w-full"
            gameTitle={gameName}
            coverImageId={imageId}
            igdbSrcSize={"s-md"}
            igdbImageSize={"s-md"}
          />
        </li>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{gameName}</AlertDialogTitle>
          <AlertDialogDescription></AlertDialogDescription>
        </AlertDialogHeader>
        <IgdbImage
          alt={`${gameName} screenshot`}
          gameTitle={gameName}
          coverImageId={imageId}
          igdbSrcSize={"s-big"}
          igdbImageSize={"s-big"}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
