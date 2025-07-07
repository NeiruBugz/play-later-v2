import { CollectionNav } from "@/shared/components/collection-nav";
import { Header } from "@/shared/components/header";
import { Body, ResponsiveHeading } from "@/shared/components/typography";

export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="container overflow-hidden px-4 py-8 pt-16">
        <div className="mb-8 mt-4 flex flex-col gap-4">
          <ResponsiveHeading level={1}>Your Collection</ResponsiveHeading>
          <Body variant="muted">
            Manage and browse through your game library
          </Body>
        </div>
        <div className="mb-8">
          <CollectionNav showAddButton={false} />
        </div>
        {children}
      </div>
    </>
  );
}
