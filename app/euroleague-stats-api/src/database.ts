import { ConfigModule } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import * as Entities from './entities/index';

// dotenvExpand.expand(dotenv.config());
ConfigModule.forRoot();

export const dbConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME || 'user',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_DATABASE || 'db',
  ssl: false,
  entities: [
    ...Object.values(Entities),
  ],
  synchronize: process.env.DATABASE_SYNC === 'true' || process.env.NODE_ENV !== 'production',
  dropSchema: false, // Set to true only if you want to drop and recreate all tables
  logging: process.env.NODE_ENV === 'development',
  // ! synchronize shouldn't be true in production
};

