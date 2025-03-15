import { AddLibraryEntry } from './add-library-entry';
import { BacklogItem } from '../../../../../shared/types/entities/BacklogItem';
import { normalizeString } from '../../../../../shared/lib/normalize-string';
import { Button, Card, Flex, HStack, Text } from '@chakra-ui/react';
import { IoPencilOutline, IoTrashBinOutline } from 'react-icons/io5';

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
              alignItems="center"
              justify="space-between"
              my={2}
              _first={{
                marginTop: 0,
              }}
            >
              <Text>{normalizeString(backlogItem.platform)}</Text>
              <Text>{backlogItem.acquisitionType}</Text>
              <HStack gap={1} alignItems="center">
                <Button size="xs" variant="outline">
                  <IoPencilOutline />
                </Button>
                <Button size="xs" variant="outline">
                  <IoTrashBinOutline />
                </Button>
              </HStack>
            </Flex>
          );
        })}
        <AddLibraryEntry gameId={gameId} />
      </Card.Body>
    </Card.Root>
  );
}
