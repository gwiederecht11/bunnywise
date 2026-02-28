"use client";

import { removeMember } from "@/lib/actions/groups";
import { ConfirmButton } from "@/components/ui/confirm-button";

export function RemoveMemberButton({
  groupId,
  userId,
}: {
  groupId: string;
  userId: string;
}) {
  return (
    <ConfirmButton
      onConfirm={async () => { await removeMember(groupId, userId); }}
      label="Remove"
      confirmLabel="Yes, remove"
      confirmMessage="Remove this member?"
    />
  );
}
