import { PropsWithChildren } from "react";
import { SiteFooter } from "@/src/shared/ui/page-footer";
import { SiteHeader } from "@/src/shared/ui/page-header";

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
