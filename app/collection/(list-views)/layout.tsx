import { notFound } from "next/navigation";

import { getUserInfo } from "@/features/manage-user-info";
import { EditorialCollectionNav } from "@/shared/components/collection-nav";
import { EditorialHeader } from "@/shared/components/header";
import { Body, Heading } from "@/shared/components/typography";

export default async function CollectionLayout(
  props: LayoutProps<"/collection">
) {
  const { children } = props;

  const userResult = await getUserInfo();

  if (userResult.data == null) {
    notFound();
  }

  const userData = userResult.data;

  return (
    <>
      <EditorialHeader authorized />
      <div className="container overflow-hidden px-4 py-8 pt-16">
        <div className="mb-8 mt-4 flex flex-col gap-2">
          <Heading level={1} size="3xl">
            Your Collection
          </Heading>
          <Body variant="muted">
            Manage and browse through your game library
          </Body>
        </div>
        <div className="mb-8">
          <EditorialCollectionNav
            showAddButton={false}
            userName={userData.username}
          />
        </div>
        {children}
      </div>
    </>
  );
}
