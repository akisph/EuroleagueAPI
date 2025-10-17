import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { Team } from '../../entities/team.entity';
import { Game } from '../../entities/game.entity';
import { Season } from '../../entities/season.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, Game, Season])
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService]
})
export class TeamsModule {}