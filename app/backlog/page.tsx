import { auth } from "@/auth";
import { BacklogList } from "@/src/widgets/backlog-list";
import { Header } from "@/src/widgets/header";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function BacklogsPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }
  return (
    <>
      <Header />
      <div className="container pt-[60px]">
        <Suspense fallback="Loading...">
          <BacklogList />
        </Suspense>
      </div>
    </>
  );
}
