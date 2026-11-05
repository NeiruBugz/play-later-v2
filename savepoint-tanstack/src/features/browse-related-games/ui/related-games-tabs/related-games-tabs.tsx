import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { RelatedGamesList } from "../related-games-list";
import type { RelatedGamesTabsProps } from "./related-games-tabs.type";

export function RelatedGamesTabs({
  sections,
  renderGame,
}: RelatedGamesTabsProps) {
  if (sections.length === 0) return null;

  const firstSection = sections[0]!;

  return (
    <Tabs
      defaultValue={tabValue(firstSection.collectionId)}
      className="min-w-0"
    >
      <TabsList className="max-w-full justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          className="data-[hidden]:hidden"
        >
          <RelatedGamesList games={section.games} renderGame={renderGame} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function tabValue(collectionId: number): string {
  return `collection-${collectionId}`;
}
