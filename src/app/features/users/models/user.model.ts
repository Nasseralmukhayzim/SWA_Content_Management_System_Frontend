export interface UserSummary {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  roles?: string[];
}

export interface UpdateUserRequest {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}
