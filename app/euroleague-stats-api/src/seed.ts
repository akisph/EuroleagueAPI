#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './modules/seed/seed.service';

async function bootstrap() {
  console.log('🏀 Euroleague API Seeding Tool');
  console.log('================================');
  
  try {
    // Create the NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get the seed service
    const seedService = app.get(SeedService);
    
    // Start seeding
    console.log('🚀 Starting seeding process...');
    const startTime = Date.now();
    
    await seedService.initializeSeeding();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`✅ Seeding completed successfully in ${duration} seconds!`);
    
    // Close the application
    await app.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

bootstrap();