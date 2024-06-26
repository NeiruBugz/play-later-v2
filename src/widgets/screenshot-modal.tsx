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
import Image from "next/image";

export function ScreenshotModal({
  imageId,
  gameName,
}: {
  imageId: number;
  gameName: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <li>
          <Image
            alt={`${gameName} screenshot`}
            src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${imageId}.png`}
            width={NEXT_IMAGE_SIZES.hd.width}
            height={NEXT_IMAGE_SIZES.hd.height}
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
          src={`${IMAGE_API}/${IMAGE_SIZES["s-md"]}/${imageId}.png`}
          width={NEXT_IMAGE_SIZES.hd.width}
          height={NEXT_IMAGE_SIZES.hd.height}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
