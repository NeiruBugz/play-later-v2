import { getServerUserId } from "@/auth";
import { EditUserForm } from "@/features/manage-user-info/components/edit-user-form";
import { getUserInfo } from "@/features/manage-user-info/server-actions/get-user-info";
import { Header } from "@/shared/components/header";
import { notFound } from "next/navigation";

export default async function UserPage() {
  const userId = await getServerUserId();

  if (!userId) {
    return notFound();
  }

  const user = await getUserInfo(userId);

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
