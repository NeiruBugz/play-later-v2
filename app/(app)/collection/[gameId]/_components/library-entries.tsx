'use client';

import { AddLibraryEntry } from './add-library-entry';
import { BacklogItem } from '../../../../../shared/types/entities/BacklogItem';
import { normalizeString } from '../../../../../shared/lib/normalize-string';
import {
  Button,
  Card,
  Flex,
  HStack,
  Text,
  VStack,
  Badge,
  Separator,
  Box,
} from '@chakra-ui/react';
import {
  IoPencilOutline,
  IoTrashBinOutline,
  IoGameControllerOutline,
  IoCheckmarkCircleOutline,
  IoHourglassOutline,
  IoHeartOutline,
} from 'react-icons/io5';
import { useState } from 'react';
import { toaster } from '@/shared/components/ui/toaster';
import { Tooltip } from '@/shared/components/ui/tooltip';

// Status icon mapping
const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'TO_PLAY':
      return <IoHourglassOutline />;
    case 'PLAYING':
      return <IoGameControllerOutline />;
    case 'COMPLETED':
      return <IoCheckmarkCircleOutline />;
    case 'PLAYED':
      return <IoCheckmarkCircleOutline color="gray" />;
    case 'WISHLIST':
      return <IoHeartOutline />;
    default:
      return null;
  }
};

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case 'TO_PLAY':
      return 'blue';
    case 'PLAYING':
      return 'green';
    case 'COMPLETED':
      return 'purple';
    case 'PLAYED':
      return 'gray';
    case 'WISHLIST':
      return 'pink';
    default:
      return 'gray';
  }
};

// Status display name mapping
const getStatusName = (status: string) => {
  switch (status) {
    case 'TO_PLAY':
      return 'Backlog';
    case 'PLAYING':
      return 'Playing';
    case 'COMPLETED':
      return 'Completed';
    case 'PLAYED':
      return 'Played';
    case 'WISHLIST':
      return 'Wishlist';
    default:
      return status;
  }
};

export function LibraryEntries({
  backlogItems,
  gameId,
}: {
  backlogItems: BacklogItem[];
  gameId: string;
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    // TODO: Implement delete functionality
    // await deleteBacklogItem(id);

    // Simulate deletion for now
    setTimeout(() => {
      setIsDeleting(null);
      toaster.create({
        title: 'Entry removed',
        type: 'success',
        duration: 3000,
      });
    }, 1000);
  };

  const hasEntries = backlogItems.length > 0;

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Collection Entries</Card.Title>
        <Card.Description>
          {hasEntries
            ? `You have ${backlogItems.length} ${backlogItems.length === 1 ? 'entry' : 'entries'} for this game`
            : 'Track this game in your collection'}
        </Card.Description>
      </Card.Header>
      <Card.Body>
        <VStack gap={3} align="stretch">
          {hasEntries ? (
            <>
              {backlogItems.map((backlogItem) => {
                const statusColor = getStatusColor(backlogItem.status);
                return (
                  <Box
                    key={backlogItem.id}
                    p={3}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="gray.200"
                    _hover={{
                      borderColor: 'gray.300',
                      bg: 'gray.50',
                    }}
                    transition="all 0.2s"
                  >
                    <Flex gap={3} alignItems="center" justify="space-between">
                      <VStack align="start" gap={1}>
                        <Badge
                          colorPalette={statusColor}
                          variant="subtle"
                          display="flex"
                          alignItems="center"
                          gap={1}
                          px={2}
                          py={1}
                          borderRadius="md"
                        >
                          <StatusIcon status={backlogItem.status} />
                          <Text>{getStatusName(backlogItem.status)}</Text>
                        </Badge>

                        <HStack gap={2}>
                          <Text fontWeight="medium">
                            {normalizeString(backlogItem.platform)}
                          </Text>
                          <Text color="gray.500">•</Text>
                          <Text color="gray.500">
                            {backlogItem.acquisitionType}
                          </Text>
                        </HStack>
                      </VStack>

                      <HStack gap={2}>
                        <Tooltip content="Edit entry">
                          <Button
                            size="sm"
                            variant="ghost"
                            colorPalette="blue"
                            aria-label="Edit entry"
                          >
                            <IoPencilOutline />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Remove entry">
                          <Button
                            size="sm"
                            variant="ghost"
                            colorPalette="red"
                            aria-label="Remove entry"
                            loading={isDeleting === backlogItem.id}
                            onClick={() => handleDelete(backlogItem.id)}
                          >
                            <IoTrashBinOutline />
                          </Button>
                        </Tooltip>
                      </HStack>
                    </Flex>
                  </Box>
                );
              })}
            </>
          ) : (
            <Box
              p={4}
              borderRadius="md"
              borderWidth="1px"
              borderStyle="dashed"
              borderColor="gray.300"
              textAlign="center"
            >
              <Text color="gray.500">No entries yet</Text>
            </Box>
          )}

          {/* Only show Add to collection button if there are no entries */}
          {!hasEntries && (
            <>
              <Separator my={2} />
              <AddLibraryEntry gameId={gameId} />
            </>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
