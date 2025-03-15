'use client';

import { toaster } from '@/shared/components/ui/toaster';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { StatusButton } from '@/shared/components/ui/status-button';
import { BacklogItemStatus } from '@/shared/types/entities/BacklogItem';
import { Game } from '@/shared/types/entities/Game';
import { updateBacklogItem } from '@/features/backlog/actions/update-backlog-item';
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
  // Get the first backlog item if available, or use the one matching the status param
  const statusParam = params.get('status') as BacklogItemStatus | null;

  const currentItem = backlogItemList?.length
    ? statusParam
      ? backlogItemList.find((item) => item.status === statusParam) ||
        backlogItemList[0]
      : backlogItemList[0]
    : null;

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
        <StatusButton
          status="completed"
          hidden={currentStatus === 'COMPLETED'}
          onClick={() => onStatusUpdate('COMPLETED')}
        >
          <IoCheckmarkDoneOutline size={8} />
        </StatusButton>
      </Tooltip>
      <Tooltip content="Move to backlog">
        <StatusButton
          status="backlog"
          hidden={currentStatus === 'TO_PLAY'}
          onClick={() => onStatusUpdate('TO_PLAY')}
        >
          <IoLibrarySharp size={8} />
        </StatusButton>
      </Tooltip>
      <Tooltip content="Mark as played">
        <StatusButton
          status="played"
          hidden={currentStatus === 'PLAYED'}
          onClick={() => onStatusUpdate('PLAYED')}
        >
          <IoCheckmarkCircleOutline size={8} />
        </StatusButton>
      </Tooltip>
      <Tooltip content="Start playing">
        <StatusButton
          status="playing"
          hidden={currentStatus === 'PLAYING'}
          onClick={() => onStatusUpdate('PLAYING')}
        >
          <IoPlayOutline size={8} />
        </StatusButton>
      </Tooltip>
    </>
  );
}
