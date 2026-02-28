"use client";

import { deleteGroup } from "@/lib/actions/groups";
import { ConfirmButton } from "@/components/ui/confirm-button";

export function DeleteGroupButton({ groupId }: { groupId: string }) {
  return (
    <ConfirmButton
      onConfirm={() => deleteGroup(groupId)}
      label="Delete Group"
      confirmLabel="Yes, delete"
      confirmMessage="Are you sure?"
      variant="danger"
    />
  );
}
