import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { INestApplication } from '@nestjs/common';

export async function clearDatabase(app: INestApplication): Promise<void> {
  const collections = [
    'users',
    'dashboards',
    'widgets',
    'datasources',
    'aiconversations',
    'roles',
    'permissions',
  ];

  for (const collection of collections) {
    try {
      const model = app.get<Model<any>>(getModelToken(collection));
      if (model) {
        await model.deleteMany({});
      }
    } catch {
      // Collection doesn't exist yet
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function seedDatabase(_app: INestApplication): Promise<void> {
  // To be implemented based on needs
  // Example: create test users, roles, etc.
}
