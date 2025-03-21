'use client';

import { updateBacklogItem } from '@/features/backlog/actions/update-backlog-item';
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
  BacklogItem,
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
import { IoPencilOutline, IoSaveOutline } from 'react-icons/io5';

interface EditLibraryEntryProps {
  backlogItem: BacklogItem;
  gameId: string;
  onUpdate?: () => void;
}

export function EditLibraryEntry({
  backlogItem,
  gameId,
  onUpdate,
}: EditLibraryEntryProps) {
  const [status, setStatus] = useState<BacklogItemStatus>(backlogItem.status);
  const [platform, setPlatform] = useState(backlogItem.platform || '');
  const [acquisitionType, setAcquisitionType] = useState<AcquisitionType>(
    backlogItem.acquisitionType,
  );
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data } = useSession();

  const handleSubmit = async () => {
    if (!data?.user?.id) {
      toaster.create({
        title: 'Authentication required',
        description: 'Please sign in to edit your collection',
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
      id: backlogItem.id,
      status,
      platform,
      acquisitionType,
      gameId,
    };

    try {
      await updateBacklogItem(input);
      setOpen(false);
      toaster.create({
        title: 'Collection entry updated',
        type: 'success',
        duration: 3000,
      });

      if (onUpdate) {
        setTimeout(() => {
          onUpdate();
        }, 100);
      }
    } catch (error) {
      console.error(error);
      toaster.create({
        title: 'Failed to update entry',
        description: 'An error occurred while updating your collection',
        type: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStatus(backlogItem.status);
    setPlatform(backlogItem.platform || '');
    setAcquisitionType(backlogItem.acquisitionType);
  };

  const handleOpenChange = (data: { open: boolean }) => {
    if (!data.open) {
      setTimeout(resetForm, 300);
    }
    setOpen(data.open);
  };

  return (
    <DialogRoot placement="center" open={open} onOpenChange={handleOpenChange}>
      <DialogBackdrop />
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          colorPalette="blue"
          aria-label="Edit entry"
        >
          <IoPencilOutline />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogCloseTrigger />
        <DialogHeader>
          <DialogTitle>Edit collection entry</DialogTitle>
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
              loadingText="Updating..."
              disabled={!platform}
            >
              <Flex align="center" gap={2}>
                <IoSaveOutline />
                <span>Save changes</span>
              </Flex>
            </Button>
          </Flex>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}
