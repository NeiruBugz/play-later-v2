import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function CollectionPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return <div>Collection</div>;
}
