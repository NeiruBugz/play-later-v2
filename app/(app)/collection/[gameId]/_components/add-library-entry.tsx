'use client';

import { createBacklogItem } from '@/features/backlog/actions/create-backlog-item';
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
} from '@/shared/components/ui/dialog';
import { toaster } from '@/shared/components/ui/toaster';
import {
  AcquisitionType,
  BacklogItemStatus,
} from '@/shared/types/entities/BacklogItem';
import {
  Button,
  Field,
  NativeSelectField,
  NativeSelectIndicator,
  NativeSelectRoot,
  VStack,
  Flex,
  Box,
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { IoAddCircleOutline, IoGameControllerOutline } from 'react-icons/io5';

export function AddLibraryEntry({ gameId }: { gameId: string }) {
  const [status, setStatus] = useState<BacklogItemStatus>('TO_PLAY');
  const [platform, setPlatform] = useState('');
  const [acquisitionType, setAcquisitionType] =
    useState<AcquisitionType>('DIGITAL');
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data } = useSession();

  const handleSubmit = async () => {
    if (!data?.user?.id) {
      toaster.create({
        title: 'Authentication required',
        description: 'Please sign in to add games to your collection',
        type: 'error',
        duration: 3000,
      });
      return;
    }

    if (!platform) {
      toaster.create({
        title: 'Platform required',
        description: 'Please select a platform',
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    const input = {
      userId: data.user.id,
      gameId,
      status,
      platform,
      acquisitionType,
    };

    try {
      await createBacklogItem(input);
      setOpen(false);
      toaster.create({
        title: 'Game added to collection',
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      toaster.create({
        title: 'Failed to add game',
        description:
          'An error occurred while adding the game to your collection',
        type: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStatus('TO_PLAY');
    setPlatform('');
    setAcquisitionType('DIGITAL');
  };

  const handleOpenChange = (data: { open: boolean }) => {
    if (!data.open) {
      // Reset form when dialog is closed
      setTimeout(resetForm, 300);
    }
    setOpen(data.open);
  };

  return (
    <DialogRoot placement="center" open={open} onOpenChange={handleOpenChange}>
      <DialogBackdrop />
      <DialogTrigger asChild>
        <Button variant="solid" colorPalette="blue" size="md" width="100%">
          <Flex align="center" gap={2}>
            <IoAddCircleOutline />
            <span>Add to collection</span>
          </Flex>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogCloseTrigger />
        <DialogHeader>
          <DialogTitle>Add to your collection</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack gap={5} align="stretch">
            <Field.Root>
              <Field.Label>Status</Field.Label>
              <Field.HelperText>
                How do you want to track this game?
              </Field.HelperText>
              <Box mt={2}>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as BacklogItemStatus)
                    }
                  >
                    <option value="TO_PLAY">Backlog - Plan to play</option>
                    <option value="PLAYING">Currently Playing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PLAYED">Played (but not completed)</option>
                    <option value="WISHLIST">Wishlist</option>
                  </NativeSelectField>
                  <NativeSelectIndicator />
                </NativeSelectRoot>
              </Box>
            </Field.Root>

            <Field.Root>
              <Field.Label>Platform</Field.Label>
              <Field.HelperText>
                Which platform do you own this game on?
              </Field.HelperText>
              <Box mt={2}>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a platform
                    </option>
                    <option value="pc">PC</option>
                    <option value="xbox_series">Xbox Series X|S</option>
                    <option value="xbox_one">Xbox One</option>
                    <option value="ps5">PlayStation 5</option>
                    <option value="ps4">PlayStation 4</option>
                    <option value="switch">Nintendo Switch</option>
                    <option value="mobile">Mobile</option>
                    <option value="other">Other</option>
                  </NativeSelectField>
                  <NativeSelectIndicator />
                </NativeSelectRoot>
              </Box>
            </Field.Root>

            <Field.Root>
              <Field.Label>Acquisition Type</Field.Label>
              <Field.HelperText>
                How did you acquire this game?
              </Field.HelperText>
              <Box mt={2}>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={acquisitionType}
                    onChange={(e) =>
                      setAcquisitionType(e.target.value as AcquisitionType)
                    }
                  >
                    <option value="DIGITAL">Digital Purchase</option>
                    <option value="PHYSICAL">Physical Copy</option>
                    <option value="SUBSCRIPTION">
                      Subscription (Game Pass, PS+, etc.)
                    </option>
                  </NativeSelectField>
                  <NativeSelectIndicator />
                </NativeSelectRoot>
              </Box>
            </Field.Root>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <Flex justify="space-between" width="100%">
            <DialogActionTrigger asChild>
              <Button variant="ghost" size="md">
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              onClick={handleSubmit}
              size="md"
              colorPalette="blue"
              loading={isSubmitting}
              loadingText="Adding..."
              disabled={!platform}
            >
              <Flex align="center" gap={2}>
                <IoGameControllerOutline />
                <span>Add to collection</span>
              </Flex>
            </Button>
          </Flex>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}
