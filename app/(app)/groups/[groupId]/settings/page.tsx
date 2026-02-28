import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { AddMemberForm } from "@/components/groups/add-member-form";
import { DeleteGroupButton } from "@/components/groups/delete-group-button";
import { RemoveMemberButton } from "@/components/groups/remove-member-button";
import { LeaveGroupButton } from "@/components/groups/leave-group-button";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch group to check if current user is creator
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, created_by")
    .eq("id", groupId)
    .single();

  const isCreator = group?.created_by === user!.id;

  // Fetch members with profile info
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, joined_at, profiles(id, email, full_name)")
    .eq("group_id", groupId);

  return (
    <div className="space-y-8">
      {/* Members section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Members</h2>
        <div className="mb-4 space-y-2">
          {members?.map((member) => {
            const profile = member.profiles as unknown as {
              id: string;
              email: string;
              full_name: string;
            };
            const isSelf = member.user_id === user!.id;

            return (
              <div
                key={member.user_id}
                className="flex items-center justify-between rounded-lg border border-foreground/10 p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {profile?.full_name || profile?.email}
                    {isSelf && (
                      <span className="ml-2 text-foreground/40">(you)</span>
                    )}
                  </p>
                  {profile?.full_name && (
                    <p className="text-xs text-foreground/40">
                      {profile.email}
                    </p>
                  )}
                </div>
                {isCreator && !isSelf && (
                  <RemoveMemberButton
                    groupId={groupId}
                    userId={member.user_id}
                  />
                )}
              </div>
            );
          })}
        </div>

        <h3 className="mb-2 text-sm font-medium">Add a member</h3>
        <AddMemberForm groupId={groupId} />
      </div>

      {/* Danger zone */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-red-600">
          Danger Zone
        </h2>
        <div className="space-y-4">
          {!isCreator && (
            <div className="rounded-lg border border-red-200 p-4">
              <p className="mb-3 text-sm text-foreground/60">
                Leave this group. You can be re-added by the group creator.
              </p>
              <LeaveGroupButton groupId={groupId} />
            </div>
          )}
          {isCreator && (
            <div className="rounded-lg border border-red-200 p-4">
              <p className="mb-3 text-sm text-foreground/60">
                Permanently delete this group and all its expenses. This action
                cannot be undone.
              </p>
              <DeleteGroupButton groupId={groupId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
