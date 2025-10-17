import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PlayerStatsDto, TeamPlayersStatsDto } from './dto/player-stats.dto';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  /**
   * Get statistics for all players of a specific team
   * @param teamCode Team code (e.g., "MAD", "PAO")
   * @param seasonCode Optional season code filter (e.g., "E2025")
   * @returns Statistics for all players in the team including season averages
   */
  @Get('team/:teamCode/stats')
  async getTeamPlayersStats(
    @Param('teamCode') teamCode: string,
    @Query('season') seasonCode?: string
  ): Promise<TeamPlayersStatsDto> {
    return this.playersService.getTeamPlayersStats(teamCode, seasonCode);
  }

  /**
   * Get detailed statistics for a specific player
   * @param playerId Player ID (unique identifier)
   * @param seasonCode Optional season code filter (e.g., "E2025")
   * @returns Analytical and generic player stats including averages and all games
   */
  @Get(':playerId/stats')
  async getPlayerStats(
    @Param('playerId', ParseIntPipe) playerId: number,
    @Query('season') seasonCode?: string
  ): Promise<PlayerStatsDto> {
    return this.playersService.getPlayerStats(playerId, seasonCode);
  }
}