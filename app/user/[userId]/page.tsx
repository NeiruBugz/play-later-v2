import { getUserInfo } from "@/slices/user/api/get-user-info";
import { EditUserForm } from "@/slices/user/widgets";
import { GenericPageProps } from "@/src/shared/types";
import { Header } from "@/src/widgets/header";
import { notFound } from "next/navigation";

export default async function UserPage(props: GenericPageProps) {
  const params = await props.params;
  const user = await getUserInfo(params.userId);

  if (!user) {
    return notFound();
  }

  return (
    <>
      <Header />
      <div className="container mx-auto pt-[60px]">
        <h2 className="my-2 font-bold md:text-xl xl:text-2xl">Games import</h2>
        {/*<ExternalLibrariesImport />*/}
        <EditUserForm userInfo={user} />
      </div>
    </>
  );
}
