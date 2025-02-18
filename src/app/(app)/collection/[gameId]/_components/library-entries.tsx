import { AddLibraryEntry } from '@/app/(app)/collection/[gameId]/_components/add-library-entry';
import { BacklogItem } from '@/domain/entities/BacklogItem';
import { normalizeString } from '@/lib/normalize-string';
import { Card, Flex, Text } from '@chakra-ui/react';

export function LibraryEntries({
  backlogItems,
  gameId,
}: {
  backlogItems: BacklogItem[];
  gameId: string;
}) {
  if (!backlogItems.length) {
    return (
      <Card.Root>
        <Card.Header>
          <Card.Title>Library Entries</Card.Title>
        </Card.Header>
        <Card.Body>
          <Card.Description>No entries. Add one</Card.Description>
        </Card.Body>
      </Card.Root>
    );
  }
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Collection Entries</Card.Title>
      </Card.Header>
      <Card.Body>
        {backlogItems.map((backlogItem) => {
          return (
            <Flex
              key={backlogItem.id}
              borderBottom="1px dashed"
              gap={10}
              justify="space-between"
              my={2}
              _first={{
                marginTop: 0,
              }}
            >
              <Text>{normalizeString(backlogItem.platform)}</Text>
              <Text>{backlogItem.acquisitionType}</Text>
            </Flex>
          );
        })}
        <AddLibraryEntry gameId={gameId} />
      </Card.Body>
    </Card.Root>
  );
}
