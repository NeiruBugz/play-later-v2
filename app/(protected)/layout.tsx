import { SiteFooter } from "@/src/components/shared/page-footer";
import { SiteHeader } from "@/src/components/shared/page-header";
import { PropsWithChildren } from "react";

export default function LibraryLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SiteHeader />
      <main className="h-[calc(100vh-64px-48px)] overflow-auto bg-background">
        <div className="h-full">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
