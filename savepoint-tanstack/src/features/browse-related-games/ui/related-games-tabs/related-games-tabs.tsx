import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { RelatedGamesInfiniteList } from "../related-games-infinite-list";
import type { RelatedGamesTabsProps } from "./related-games-tabs.type";

export function RelatedGamesTabs({ sections }: RelatedGamesTabsProps) {
  if (sections.length === 0) return null;

  const firstSection = sections[0]!;

  return (
    <Tabs defaultValue={tabValue(firstSection.collectionId)}>
      <TabsList>
        {sections.map((section) => (
          <TabsTrigger
            key={section.collectionId}
            value={tabValue(section.collectionId)}
          >
            {section.collectionName}
          </TabsTrigger>
        ))}
      </TabsList>
      {sections.map((section) => (
        <TabsContent
          key={section.collectionId}
          value={tabValue(section.collectionId)}
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <RelatedGamesInfiniteList
            collectionId={section.collectionId}
            pageSize={section.pageSize}
            firstPage={section.firstPage}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function tabValue(collectionId: number): string {
  return `collection-${collectionId}`;
}
