// Domain contracts for User Profile used by Panel & Auth.

export type UserProfile = {
  user_id?: string | null;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  country_code?: string | null;
  marketing_opt_in?: boolean | null;
};

export type GetProfileResponse = { profile: UserProfile | null };

export type PatchProfileInput = Partial<UserProfile> & { email?: string };

export type PatchProfileResponse = { profile: UserProfile | null };
