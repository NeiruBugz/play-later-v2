import { EditUserForm } from "@/features/manage-user-info/components/edit-user-form";
import { getUserInfo } from "@/features/manage-user-info/server-actions/get-user-info";
import { Header } from "@/shared/components/header";
import { GenericPageProps } from "@/shared/types";
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
        <h2 className="my-2 font-bold md:text-xl xl:text-2xl">User settings</h2>
        <EditUserForm userInfo={user} />
      </div>
    </>
  );
}
