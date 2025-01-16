import { Button } from "@/src/shared/ui";
import Link from "next/link";

function ExternalLibrariesImport() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button className="my-2 w-fit">
        <Link href="/import/steam">Import Steam games</Link>
      </Button>
      <Button className="my-2 w-fit" disabled>
        Import Xbox games
      </Button>
      <Button className="my-2 w-fit" disabled>
        Import PlayStation games
      </Button>
    </div>
  );
}
export { ExternalLibrariesImport };
