import { redirect } from "next/navigation";
import { db } from "@/src/shared/api";

export async function getUserById(id: string) {
  try {
    const user = await db.user.findUnique({
      where: {
        id,
      },
    });
    return user?.username || user?.name;
  } catch (error) {
    redirect("/");
  }
}
