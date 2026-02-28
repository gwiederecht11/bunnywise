"use client";

import { leaveGroup } from "@/lib/actions/groups";
import { ConfirmButton } from "@/components/ui/confirm-button";

export function LeaveGroupButton({ groupId }: { groupId: string }) {
  return (
    <ConfirmButton
      onConfirm={async () => { await leaveGroup(groupId); }}
      label="Leave Group"
      confirmLabel="Yes, leave"
      confirmMessage="Leave this group?"
      variant="danger"
    />
  );
}
