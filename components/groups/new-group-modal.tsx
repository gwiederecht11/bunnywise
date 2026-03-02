"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { createGroup } from "@/lib/actions/groups";

export function NewGroupModal() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await createGroup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <>
      <Button color="primary" onPress={onOpen}>
        New Group
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <form action={handleSubmit}>
              <ModalHeader>Create a Group</ModalHeader>
              <ModalBody>
                {error && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
                <Input
                  name="name"
                  type="text"
                  label="Group name"
                  placeholder="e.g. Apartment, Trip to Italy"
                  variant="bordered"
                  isRequired
                />
                <Input
                  name="description"
                  type="text"
                  label="Description (optional)"
                  placeholder="What's this group for?"
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button type="submit" color="primary" isLoading={loading}>
                  {loading ? "Creating..." : "Create Group"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
