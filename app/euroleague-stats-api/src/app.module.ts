import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SeedModule } from './modules/seed/seed.module';
import { dbConfig } from './database';

//iof not use proccess env doesnt defined
ConfigModule.forRoot();
console.debug('Database Config:', dbConfig);

const dbModule = TypeOrmModule.forRoot(dbConfig);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    dbModule,
    SeedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
