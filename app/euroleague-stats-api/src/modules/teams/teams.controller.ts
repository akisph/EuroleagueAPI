import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamStatsDto, AllTeamsStatsDto } from './dto/team-game-stats.dto';
import { Team } from '../../entities/team.entity';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  /**
   * Get all teams basic information
   * @returns All teams with their basic information (id, code, name, city, country)
   */
  @Get()
  async getAllTeams(): Promise<Team[]> {
    return this.teamsService.getAllTeams();
  }



  /**
   * Get statistics for all teams
   * @param seasonCode Optional season code filter (e.g., "E2025")
   * @returns Statistics for all teams including games played, venues, opponents, scores
   */
  @Get('stats')
  async getAllTeamsStats(
    @Query('season') seasonCode?: string
  ): Promise<AllTeamsStatsDto> {
    return this.teamsService.getAllTeamsStats(seasonCode);
  }

  /**
   * Get statistics for a specific team by ID
   * @param teamId Team ID
   * @param seasonCode Optional season code filter (e.g., "E2025")
   * @returns Statistics for the specified team including games played, venues, opponents, scores
   */
  @Get(':id/stats')
  async getTeamStats(
    @Param('id', ParseIntPipe) teamId: number,
    @Query('season') seasonCode?: string
  ): Promise<TeamStatsDto> {
    return this.teamsService.getTeamStats(teamId, seasonCode);
  }


}