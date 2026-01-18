export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: RoleResponse | null;
}

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  permissions: PermissionResponse[];
}

export interface PermissionResponse {
  id: string;
  name: string;
  description?: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}
