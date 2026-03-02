"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react";

export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel = "Yes, confirm",
  confirmMessage = "Are you sure?",
  variant = "inline",
}: {
  onConfirm: () => void | Promise<void>;
  label: string;
  confirmLabel?: string;
  confirmMessage?: string;
  variant?: "inline" | "danger";
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [loading, setLoading] = useState(false);

  async function handleConfirm(onClose: () => void) {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  }

  return (
    <>
      {variant === "danger" ? (
        <Button color="danger" onPress={onOpen}>
          {label}
        </Button>
      ) : (
        <Button
          variant="light"
          size="sm"
          color="danger"
          onPress={onOpen}
        >
          {label}
        </Button>
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Confirm</ModalHeader>
              <ModalBody>
                <p>{confirmMessage}</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  isLoading={loading}
                  onPress={() => handleConfirm(onClose)}
                >
                  {confirmLabel}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
