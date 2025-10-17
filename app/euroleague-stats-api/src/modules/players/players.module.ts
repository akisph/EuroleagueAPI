import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { Player } from '../../entities/player.entity';
import { PlayerGameStats } from '../../entities/player-game-stats.entity';
import { Team } from '../../entities/team.entity';
import { Game } from '../../entities/game.entity';
import { Season } from '../../entities/season.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Player, PlayerGameStats, Team, Game, Season])
  ],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService]
})
export class PlayersModule {}