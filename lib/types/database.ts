export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  created_by: string;
};

export type GroupMember = {
  user_id: string;
  group_id: string;
  joined_at: string;
};

// Supabase join queries return related rows as objects (for !inner / single FK)
// but TypeScript infers them as arrays. These types reflect the actual runtime shape.

export type GroupMemberWithProfile = {
  user_id: string;
  joined_at: string;
  profiles: Profile;
};

export type GroupMemberWithGroup = {
  group_id: string;
  groups: Pick<Group, "id" | "name" | "description">;
};

export type ExpenseWithPayer = {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  expense_date: string;
  created_at: string;
  profiles: Pick<Profile, "full_name" | "email">;
};
