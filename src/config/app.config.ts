import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:5173',
  ],
  openaiApiKey: process.env.OPENAI_API_KEY,
  aiModel: process.env.AI_MODEL || 'gpt-4o-mini',
}));
