import { BacklogList } from "@/src/widgets/backlog-list";
import { Header } from "@/src/widgets/header";
import { Suspense } from "react";

export default async function BacklogsPage() {
  return (
    <>
      <Header />
      <div className="container">
        <Suspense fallback="Loading...">
          <BacklogList />
        </Suspense>
      </div>
    </>
  );
}
