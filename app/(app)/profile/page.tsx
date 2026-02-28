import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>
      <ProfileForm
        email={profile?.email ?? user!.email ?? ""}
        fullName={profile?.full_name ?? ""}
      />
    </div>
  );
}
