import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
