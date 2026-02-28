import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { GroupTabs } from "@/components/groups/group-tabs";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, description")
    .eq("id", groupId)
    .single();

  if (!group) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        {group.description && (
          <p className="mt-1 text-sm text-foreground/60">
            {group.description}
          </p>
        )}
      </div>

      <GroupTabs groupId={groupId} />

      {children}
    </div>
  );
}
