'use client';

import {
  DialogRoot,
  DialogBackdrop,
  DialogTrigger,
  DialogContent,
  DialogCloseTrigger,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
} from '../../../../../shared/components/ui/dialog';
import {
  AcquisitionType,
  BacklogItemStatus,
} from '../../../../../shared/types/entities/BacklogItem';
import {
  Button,
  Field,
  NativeSelectField,
  NativeSelectIndicator,
  NativeSelectRoot,
  VStack,
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { createBacklogItem } from '../../../../../features/collection/create-backlog-item';

export function AddLibraryEntry({ gameId }: { gameId: string }) {
  const [status, setStatus] = useState('');
  const [platform, setPlatform] = useState('');
  const [acquisitionType, setAcquisitionType] = useState('');
  const [open, setOpen] = useState(false);
  const { data } = useSession();

  const handleSubmit = async () => {
    if (!data?.user?.id) {
      return;
    }

    const input = {
      userId: data?.user?.id,
      gameId,
      status: status ? (status as BacklogItemStatus) : 'TO_PLAY',
      platform,
      acquisitionType: acquisitionType
        ? (acquisitionType as AcquisitionType)
        : 'DIGITAL',
    };

    try {
      await createBacklogItem(input);
      setOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DialogRoot
      placement="center"
      open={open}
      onOpenChange={(d) => setOpen(d.open)}
    >
      <DialogBackdrop />
      <DialogTrigger asChild>
        <Button variant="outline" my={2}>
          Add new
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogCloseTrigger />
        <DialogHeader>
          <DialogTitle>New Collection entry</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack spaceY={4}>
            <Field.Root>
              <Field.Label>Status</Field.Label>
              <NativeSelectRoot>
                <NativeSelectField
                  placeholder="Select status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="TO_PLAY">Backlog</option>
                  <option value="PLAYING">Playing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PLAYED">Played</option>
                  <option value="WISHLIST">Wishlist</option>
                </NativeSelectField>
                <NativeSelectIndicator />
              </NativeSelectRoot>
            </Field.Root>
            <Field.Root>
              <Field.Label>Platform</Field.Label>
              <NativeSelectRoot>
                <NativeSelectField
                  placeholder="Select platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option value="pc">PC</option>
                  <option value="xbox">Xbox</option>
                  <option value="playstation">PlayStation</option>
                </NativeSelectField>
                <NativeSelectIndicator />
              </NativeSelectRoot>
            </Field.Root>
            <Field.Root>
              <Field.Root>Acquisition Type</Field.Root>
              <NativeSelectRoot>
                <NativeSelectField
                  placeholder="Select acquisition type"
                  value={acquisitionType}
                  onChange={(e) => setAcquisitionType(e.target.value)}
                >
                  <option value="DIGITAL">Digital</option>
                  <option value="PHYSICAL">Physical</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                </NativeSelectField>
                <NativeSelectIndicator />
              </NativeSelectRoot>
            </Field.Root>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline" size="md">
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button
            onClick={handleSubmit}
            alignSelf="start"
            size="md"
            disabled={!status || !platform || !acquisitionType}
          >
            Add entry
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}
