export interface PermissionResponse {
  id: string;
  name: string;
  description?: string;
}

export interface RoleResponse {
  _id?: string;
  id: string;
  name: string;
  description?: string;
  permissions: PermissionResponse[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserResponse {
  _id: string;
  id: string;
  username: string;
  email: string;
  role: RoleResponse | null;
  isActive: boolean;
  preferences?: { theme?: string; language?: string };
  createdAt?: Date;
  updatedAt?: Date;
}
