import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { Season, Team, Player, Game, PlayerGameStats, TeamGameStats, ScoringEvent } from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Season,
      Team,
      Player,
      Game,
      PlayerGameStats,
      TeamGameStats,
      ScoringEvent,
    ]),
  ],
  providers: [SeedService],
  controllers: [SeedController],
  exports: [SeedService],
})
export class SeedModule {}
