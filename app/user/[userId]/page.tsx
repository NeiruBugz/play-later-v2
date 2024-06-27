import { notFound } from "next/navigation";
import { EditUserForm } from "@/src/widgets/edit-user-form";
import { Header } from "@/src/widgets/header";
import { getUserInfo } from "@/src/entities/user";
import { GenericPageProps } from "@/src/shared/types";

export default async function UserPage({ params }: GenericPageProps) {
  const user = await getUserInfo(params.userId);

  if (!user) {
    return notFound();
  }

  return (
    <>
      <Header />
      <div className="container mx-auto">
        <EditUserForm userInfo={user} />
      </div>
    </>
  );
}
