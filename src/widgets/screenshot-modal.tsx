import Image from "next/image";
import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/shared/config/image.config";
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
          <Image
            alt={`${gameName} screenshot`}
            src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${imageId}.png`}
            width={NEXT_IMAGE_SIZES["s-md"].width}
            height={NEXT_IMAGE_SIZES["s-md"].height}
            className="h-auto w-full"
          />
        </li>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{gameName}</AlertDialogTitle>
          <AlertDialogDescription></AlertDialogDescription>
        </AlertDialogHeader>
        <Image
          alt={`${gameName} screenshot`}
          src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${imageId}.png`}
          width={NEXT_IMAGE_SIZES["s-big"].width}
          height={NEXT_IMAGE_SIZES["s-big"].height}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
