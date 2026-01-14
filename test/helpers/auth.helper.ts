export interface TestUser {
  id: string;
  email: string;
  password: string;
  token?: string;
}

export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin@123',
  },
  user: {
    email: 'user@test.com',
    password: 'User@123',
  },
};

export function createAuthHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
