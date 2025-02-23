'use client';

import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import { BacklogItemStatus } from '@/domain/entities/BacklogItem';
import { Game } from '@/domain/entities/Game';
import { updateBacklogItem } from '@/features/collection/update-backlog-item';
import { Button } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import {
  IoCheckmarkCircleOutline,
  IoCheckmarkDoneOutline,
  IoLibrarySharp,
  IoPlayOutline,
} from 'react-icons/io5';

export function UpdateBacklogItem({
  backlogItemList,
}: {
  backlogItemList: Game['backlogItems'];
}) {
  const params = useSearchParams();
  const currentItem = backlogItemList?.find(
    (item) => item.status === (params.get('status') as BacklogItemStatus),
  );

  const onStatusUpdate = useCallback(
    async (status: BacklogItemStatus) => {
      if (!currentItem) {
        return;
      }

      try {
        const input = {
          id: currentItem.id,
          gameId: currentItem.gameId,
          status,
          acquisitionType: currentItem.acquisitionType,
          platform: currentItem.platform as string,
        };
        await updateBacklogItem(input);
        toaster.create({
          title: 'Status updated',
          type: 'success',
        });
      } catch (e) {
        console.error(e);
        toaster.create({
          title: 'Failed to update status',
          type: 'error',
        });
      }
    },
    [currentItem],
  );

  if (!currentItem) {
    return null;
  }

  const { status: currentStatus } = currentItem;

  return (
    <>
      <Tooltip content="Mark as completed">
        <Button
          size="xs"
          hidden={currentStatus === 'COMPLETED'}
          onClick={() => onStatusUpdate('COMPLETED')}
        >
          <IoCheckmarkDoneOutline size={12} />
        </Button>
      </Tooltip>
      <Tooltip content="Move to backlog">
        <Button
          size="xs"
          hidden={currentStatus === 'TO_PLAY'}
          onClick={() => onStatusUpdate('TO_PLAY')}
        >
          <IoLibrarySharp size={12} />
        </Button>
      </Tooltip>
      <Tooltip content="Mark as played">
        <Button
          size="xs"
          hidden={currentStatus === 'PLAYED'}
          onClick={() => onStatusUpdate('PLAYED')}
        >
          <IoCheckmarkCircleOutline size={12} />
        </Button>
      </Tooltip>
      <Tooltip content="Start playing">
        <Button
          size="xs"
          hidden={currentStatus === 'PLAYING'}
          onClick={() => onStatusUpdate('PLAYING')}
        >
          <IoPlayOutline size={12} />
        </Button>
      </Tooltip>
    </>
  );
}
