import { notFound } from "next/navigation";

import { CollectionNav } from "@/shared/components/collection-nav";
import { Header } from "@/shared/components/header";
import { Body, ResponsiveHeading } from "@/shared/components/typography";
import { UserService } from "@/shared/services/user";

export default async function CollectionLayout(
  props: LayoutProps<"/collection">
) {
  const { children } = props;

  const userService = new UserService();
  const userResult = await userService.getUserInfo();

  if (!userResult.success || userResult.data == null) {
    notFound();
  }

  const userData = userResult.data;

  return (
    <>
      <Header authorized />
      <div className="container overflow-hidden px-4 py-8 pt-16">
        <div className="mb-8 mt-4 flex flex-col gap-4">
          <ResponsiveHeading level={1}>Your Collection</ResponsiveHeading>
          <Body variant="muted">
            Manage and browse through your game library
          </Body>
        </div>
        <div className="mb-8">
          <CollectionNav showAddButton={false} userName={userData.username} />
        </div>
        {children}
      </div>
    </>
  );
}
