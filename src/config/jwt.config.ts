import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable must be set');
  }
  return {
    secret,
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  };
});
