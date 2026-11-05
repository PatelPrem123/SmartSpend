import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('Invalid environment variables:');
  console.error(parseResult.error.format());
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

export const env = parseResult.success
  ? parseResult.data
  : {
      PORT: 5000,
      NODE_ENV: 'test',
      MONGO_URI: 'mongodb://localhost:27017/smartspend_test',
      JWT_SECRET: 'test_jwt_secret_key_minimum_32_characters_long_for_test',
      JWT_EXPIRES_IN: '7d',
      CLIENT_URL: 'http://localhost:5173',
    };
