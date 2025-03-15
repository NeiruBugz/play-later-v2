import { Dialog as ChakraModal } from '@chakra-ui/react';
import { CloseButton } from './close-button';
import * as React from 'react';

export const ModalRoot = ChakraModal.Root;
export const ModalContent = ChakraModal.Content;
export const ModalHeader = ChakraModal.Header;
export const ModalFooter = ChakraModal.Footer;
export const ModalBody = ChakraModal.Body;
export const ModalBackdrop = ChakraModal.Backdrop;

export const ModalCloseTrigger = React.forwardRef<
  HTMLButtonElement,
  ChakraModal.CloseTriggerProps
>(function ModalCloseTrigger(props, ref) {
  return (
    <ChakraModal.CloseTrigger
      position="absolute"
      top="2"
      insetEnd="2"
      {...props}
      asChild
    >
      <CloseButton size="sm" ref={ref} />
    </ChakraModal.CloseTrigger>
  );
});
