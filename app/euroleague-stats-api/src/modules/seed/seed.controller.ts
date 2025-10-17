import { Controller, Post, Logger } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  private readonly logger = new Logger(SeedController.name);

  constructor(private readonly seedService: SeedService) {}

  @Post('initialize')
  async initializeSeeding() {
    this.logger.log('🚀 Seeding initialization requested...');
    
    try {
      await this.seedService.initializeSeeding();
      return {
        success: true,
        message: 'Seeding completed successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('❌ Seeding failed:', error);
      return {
        success: false,
        message: 'Seeding failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('update')
  async updateSeeding() {
    this.logger.log('🔄 Seeding update requested...');
    
    try {
      await this.seedService.updateSeedingData();
      return {
        success: true,
        message: 'Update completed successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('❌ Update failed:', error);
      return {
        success: false,
        message: 'Update failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}