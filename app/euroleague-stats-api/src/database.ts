import { ConfigModule } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import * as Entities from './entities/index';

// dotenvExpand.expand(dotenv.config());
ConfigModule.forRoot();

export const dbConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_DATABASE,
  ssl:false,

  entities: [
    ...Object.values(Entities),
  ],
  synchronize: process.env.DATABASE_SYNC == 'true' ? true : false,
  logging: false,
   // ! shouldn't be true in production
};

