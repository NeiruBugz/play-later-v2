import { getUserInfo } from "@/src/entities/user";
import { GenericPageProps } from "@/src/shared/types";
import { Button } from "@/src/shared/ui";
import { EditUserForm } from "@/src/widgets/edit-user-form";
import { Header } from "@/src/widgets/header";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function UserPage({ params }: GenericPageProps) {
  const user = await getUserInfo(params.userId);

  if (!user) {
    return notFound();
  }

  return (
    <>
      <Header />
      <div className="container mx-auto pt-[60px]">
        <h2 className="my-2 font-bold md:text-xl xl:text-2xl">Games import</h2>
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
        <EditUserForm userInfo={user} />
      </div>
    </>
  );
}
