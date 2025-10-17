import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Player } from '../../entities/player.entity';
import { PlayerGameStats } from '../../entities/player-game-stats.entity';
import { Team } from '../../entities/team.entity';
import { Game } from '../../entities/game.entity';
import { Season } from '../../entities/season.entity';
import { 
  PlayerStatsDto, 
  TeamPlayersStatsDto, 
  PlayerBasicInfoDto, 
  PlayerGameStatsDto, 
  PlayerSeasonAveragesDto 
} from './dto/player-stats.dto';

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(PlayerGameStats)
    private readonly playerGameStatsRepository: Repository<PlayerGameStats>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(Season)
    private readonly seasonRepository: Repository<Season>,
  ) {}

  private async resolveSeason(seasonCode?: string): Promise<Season> {
    this.logger.debug(`Resolving season with code: ${seasonCode || 'undefined'}`);
    const code = seasonCode ?? process.env.CURRENT_SEASON;
    if (code) {
      this.logger.debug(`Looking for season with code: ${code}`);
      const season = await this.seasonRepository.findOne({
        where: { ssn_code: code },
      });
      if (!season) {
        this.logger.debug(`Season ${code} not found`);
        throw new NotFoundException(`Season ${code} not found`);
      }
      this.logger.debug(`Found season: ${season.ssn_code}`);
      return season;
    }

    // Fallback to latest season
    this.logger.debug('No season code provided, falling back to latest season');
    const latestSeason = await this.seasonRepository.findOne({
      order: { ssn_created_at: 'DESC' },
    });
    if (!latestSeason) {
      this.logger.debug('No season found in database');
      throw new NotFoundException('No season found');
    }
    this.logger.debug(`Using latest season: ${latestSeason.ssn_code}`);
    return latestSeason;
  }

  private calculatePercentage(made: number, attempted: number): number {
    return attempted > 0 ? Math.round((made / attempted) * 10000) / 100 : 0;
  }

  private calculateEfficiency(stats: any): number {
    // EuroLeague efficiency formula: 
    // (Points + Rebounds + Assists + Steals + Blocks) - (Missed FG + Missed FT + Turnovers)
    const missedFG = stats.fieldGoalsAttempted - stats.fieldGoalsMade;
    const missedFT = stats.freeThrowsAttempted - stats.freeThrowsMade;
    
    return (stats.points + stats.totalRebounds + stats.assists + stats.steals + stats.blocks) - 
           (missedFG + missedFT + stats.turnovers);
  }

  async getTeamPlayersStats(teamCode: string, seasonCode?: string): Promise<TeamPlayersStatsDto> {
    this.logger.log(`Getting team players stats for team: ${teamCode}, season: ${seasonCode || 'current'}`);
    
    // Find team by code
    const team = await this.teamRepository.findOne({
      where: { tm_code: teamCode },
    });

    if (!team) {
      this.logger.debug(`Team with code ${teamCode} not found`);
      throw new NotFoundException(`Team with code ${teamCode} not found`);
    }

    // Resolve season
    const season = await this.resolveSeason(seasonCode);
    
    // Get all games for the team in the specified season
    const games = await this.gameRepository.find({
      where: [
        {
          gm_fk_ssn_id: season.ssn_id,
          gm_fk_home_tm_id: team.tm_id,
        },
        {
          gm_fk_ssn_id: season.ssn_id,
          gm_fk_away_tm_id: team.tm_id,
        },
      ],
    });

    const gameIds = games.map(g => g.gm_id);

    if (gameIds.length === 0) {
      this.logger.debug(`No games found for team ${teamCode} in season ${season.ssn_code}`);
      return {
        team: {
          id: team.tm_id,
          code: team.tm_code,
          name: team.tm_name,
          city: team.tm_city || '',
          country: team.tm_country || '',
        },
        season: season.ssn_code,
        totalPlayers: 0,
        players: [],
      };
    }

    // Get all player stats for these games where the player played for this team
    const playerStats = await this.playerGameStatsRepository.find({
      where: {
        pgs_fk_gm_id: gameIds.length > 0 ? In(gameIds) : In([-1]),
        pgs_fk_tm_id: team.tm_id,
      },
      relations: ['player'],
    });

    // Group stats by player
    const playerStatsMap = new Map<number, PlayerGameStats[]>();
    for (const stat of playerStats) {
      if (!playerStatsMap.has(stat.pgs_fk_plr_id)) {
        playerStatsMap.set(stat.pgs_fk_plr_id, []);
      }
      playerStatsMap.get(stat.pgs_fk_plr_id)!.push(stat);
    }

    const playersData: Array<{
      player: PlayerBasicInfoDto;
      seasonAverages: PlayerSeasonAveragesDto;
    }> = [];
    
    for (const [playerId, stats] of playerStatsMap) {
      const player = stats[0].player;
      const seasonAverages = this.calculateSeasonAverages(stats);
      
      playersData.push({
        player: {
          id: player.plr_id,
          code: player.plr_code,
          firstName: player.plr_first_name,
          lastName: player.plr_last_name,
          position: player.plr_position,
        },
        seasonAverages,
      });
    }

    // Sort by average points descending
    playersData.sort((a, b) => b.seasonAverages.averagePoints - a.seasonAverages.averagePoints);

    this.logger.log(`Found ${playersData.length} players for team ${teamCode} in season ${season.ssn_code}`);

    return {
      team: {
        id: team.tm_id,
        code: team.tm_code,
        name: team.tm_name,
        city: team.tm_city || '',
        country: team.tm_country || '',
      },
      season: season.ssn_code,
      totalPlayers: playersData.length,
      players: playersData,
    };
  }

  async getPlayerStats(playerId: number, seasonCode?: string): Promise<PlayerStatsDto> {
    this.logger.log(`Getting player stats for player ID: ${playerId}, season: ${seasonCode || 'current'}`);
    
    // Find player by ID
    const player = await this.playerRepository.findOne({
      where: { plr_id: playerId },
    });

    if (!player) {
      this.logger.debug(`Player with ID ${playerId} not found`);
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    // Resolve season
    const season = await this.resolveSeason(seasonCode);

    // Get all games in the specified season
    const games = await this.gameRepository.find({
      where: { gm_fk_ssn_id: season.ssn_id },
      relations: ['homeTeam', 'awayTeam'],
    });

    const gameIds = games.map(g => g.gm_id);

    if (gameIds.length === 0) {
      this.logger.debug(`No games found in season ${season.ssn_code}`);
      throw new NotFoundException(`No games found in season ${season.ssn_code}`);
    }

    // Get all player stats for these games
    const playerGameStats = await this.playerGameStatsRepository.find({
      where: {
        pgs_fk_plr_id: player.plr_id,
        pgs_fk_gm_id: gameIds.length > 0 ? In(gameIds) : In([-1]),
      },
      relations: ['team', 'game', 'game.homeTeam', 'game.awayTeam'],
      order: { pgs_fk_gm_id: 'ASC' },
    });

    if (playerGameStats.length === 0) {
      this.logger.debug(`No stats found for player ID ${playerId} in season ${season.ssn_code}`);
      throw new NotFoundException(`No stats found for player ID ${playerId} in season ${season.ssn_code}`);
    }

    // Determine which team the player played for most (in case of transfers)
    const teamCounts = new Map<number, number>();
    for (const stat of playerGameStats) {
      const count = teamCounts.get(stat.pgs_fk_tm_id) || 0;
      teamCounts.set(stat.pgs_fk_tm_id, count + 1);
    }

    const primaryTeamId = Array.from(teamCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
    
    const primaryTeam = await this.teamRepository.findOne({
      where: { tm_id: primaryTeamId },
    });

    // Build game stats
    const gameStats: PlayerGameStatsDto[] = [];
    for (const stat of playerGameStats) {
      const game = stat.game;
      const isHomeGame = game.gm_fk_home_tm_id === stat.pgs_fk_tm_id;
      const opponent = isHomeGame ? game.awayTeam : game.homeTeam;

      const fieldGoalPercentage = this.calculatePercentage(stat.pgs_field_goals_made, stat.pgs_field_goals_attempted);
      const threePointPercentage = this.calculatePercentage(stat.pgs_three_pointers_made, stat.pgs_three_pointers_attempted);
      const freeThrowPercentage = this.calculatePercentage(stat.pgs_free_throws_made, stat.pgs_free_throws_attempted);
      const efficiency = this.calculateEfficiency({
        points: stat.pgs_points,
        totalRebounds: stat.pgs_total_rebounds,
        assists: stat.pgs_assists,
        steals: stat.pgs_steals,
        blocks: stat.pgs_blocks,
        fieldGoalsMade: stat.pgs_field_goals_made,
        fieldGoalsAttempted: stat.pgs_field_goals_attempted,
        freeThrowsMade: stat.pgs_free_throws_made,
        freeThrowsAttempted: stat.pgs_free_throws_attempted,
        turnovers: stat.pgs_turnovers,
      });

      gameStats.push({
        gameId: game.gm_id,
        gameCode: game.gm_code.toString(),
        date: game.gm_date,
        status: game.gm_status,
        isHomeGame,
        opponent: {
          id: opponent.tm_id,
          code: opponent.tm_code,
          name: opponent.tm_name,
          city: opponent.tm_city || '',
          country: opponent.tm_country || '',
        },
        minutesPlayed: stat.pgs_minutes_played,
        points: stat.pgs_points,
        fieldGoalsMade: stat.pgs_field_goals_made,
        fieldGoalsAttempted: stat.pgs_field_goals_attempted,
        fieldGoalPercentage,
        threePointersMade: stat.pgs_three_pointers_made,
        threePointersAttempted: stat.pgs_three_pointers_attempted,
        threePointPercentage,
        freeThrowsMade: stat.pgs_free_throws_made,
        freeThrowsAttempted: stat.pgs_free_throws_attempted,
        freeThrowPercentage,
        totalRebounds: stat.pgs_total_rebounds,
        assists: stat.pgs_assists,
        steals: stat.pgs_steals,
        blocks: stat.pgs_blocks,
        turnovers: stat.pgs_turnovers,
        fouls: stat.pgs_fouls,
        efficiency,
      });
    }

    // Calculate season averages
    const seasonAverages = this.calculateSeasonAverages(playerGameStats);

    return {
      player: {
        id: player.plr_id,
        code: player.plr_code,
        firstName: player.plr_first_name,
        lastName: player.plr_last_name,
        position: player.plr_position,
      },
      team: {
        id: primaryTeam!.tm_id,
        code: primaryTeam!.tm_code,
        name: primaryTeam!.tm_name,
        city: primaryTeam!.tm_city || '',
        country: primaryTeam!.tm_country || '',
      },
      season: season.ssn_code,
      seasonAverages,
      games: gameStats,
    };
  }

  private calculateSeasonAverages(stats: PlayerGameStats[]): PlayerSeasonAveragesDto {
    if (stats.length === 0) {
      return {
        gamesPlayed: 0,
        averageMinutes: 0,
        averagePoints: 0,
        averageFieldGoalsMade: 0,
        averageFieldGoalsAttempted: 0,
        fieldGoalPercentage: 0,
        averageThreePointersMade: 0,
        averageThreePointersAttempted: 0,
        threePointPercentage: 0,
        averageFreeThrowsMade: 0,
        averageFreeThrowsAttempted: 0,
        freeThrowPercentage: 0,
        averageTotalRebounds: 0,
        averageAssists: 0,
        averageSteals: 0,
        averageBlocks: 0,
        averageTurnovers: 0,
        averageFouls: 0,
        averageEfficiency: 0,
        totalPoints: 0,
        totalRebounds: 0,
        totalAssists: 0,
      };
    }

    const totals = stats.reduce((acc, stat) => ({
      points: acc.points + stat.pgs_points,
      fieldGoalsMade: acc.fieldGoalsMade + stat.pgs_field_goals_made,
      fieldGoalsAttempted: acc.fieldGoalsAttempted + stat.pgs_field_goals_attempted,
      threePointersMade: acc.threePointersMade + stat.pgs_three_pointers_made,
      threePointersAttempted: acc.threePointersAttempted + stat.pgs_three_pointers_attempted,
      freeThrowsMade: acc.freeThrowsMade + stat.pgs_free_throws_made,
      freeThrowsAttempted: acc.freeThrowsAttempted + stat.pgs_free_throws_attempted,
      totalRebounds: acc.totalRebounds + stat.pgs_total_rebounds,
      assists: acc.assists + stat.pgs_assists,
      steals: acc.steals + stat.pgs_steals,
      blocks: acc.blocks + stat.pgs_blocks,
      turnovers: acc.turnovers + stat.pgs_turnovers,
      fouls: acc.fouls + stat.pgs_fouls,
    }), {
      points: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointersMade: 0,
      threePointersAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      totalRebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
    });

    const gamesPlayed = stats.length;
    
    // Calculate averages
    const averagePoints = Math.round((totals.points / gamesPlayed) * 10) / 10;
    const averageFieldGoalsMade = Math.round((totals.fieldGoalsMade / gamesPlayed) * 10) / 10;
    const averageFieldGoalsAttempted = Math.round((totals.fieldGoalsAttempted / gamesPlayed) * 10) / 10;
    const averageThreePointersMade = Math.round((totals.threePointersMade / gamesPlayed) * 10) / 10;
    const averageThreePointersAttempted = Math.round((totals.threePointersAttempted / gamesPlayed) * 10) / 10;
    const averageFreeThrowsMade = Math.round((totals.freeThrowsMade / gamesPlayed) * 10) / 10;
    const averageFreeThrowsAttempted = Math.round((totals.freeThrowsAttempted / gamesPlayed) * 10) / 10;
    const averageTotalRebounds = Math.round((totals.totalRebounds / gamesPlayed) * 10) / 10;
    const averageAssists = Math.round((totals.assists / gamesPlayed) * 10) / 10;
    const averageSteals = Math.round((totals.steals / gamesPlayed) * 10) / 10;
    const averageBlocks = Math.round((totals.blocks / gamesPlayed) * 10) / 10;
    const averageTurnovers = Math.round((totals.turnovers / gamesPlayed) * 10) / 10;
    const averageFouls = Math.round((totals.fouls / gamesPlayed) * 10) / 10;

    // Calculate percentages
    const fieldGoalPercentage = this.calculatePercentage(totals.fieldGoalsMade, totals.fieldGoalsAttempted);
    const threePointPercentage = this.calculatePercentage(totals.threePointersMade, totals.threePointersAttempted);
    const freeThrowPercentage = this.calculatePercentage(totals.freeThrowsMade, totals.freeThrowsAttempted);

    // Calculate average efficiency
    const totalEfficiency = stats.reduce((acc, stat) => {
      return acc + this.calculateEfficiency({
        points: stat.pgs_points,
        totalRebounds: stat.pgs_total_rebounds,
        assists: stat.pgs_assists,
        steals: stat.pgs_steals,
        blocks: stat.pgs_blocks,
        fieldGoalsMade: stat.pgs_field_goals_made,
        fieldGoalsAttempted: stat.pgs_field_goals_attempted,
        freeThrowsMade: stat.pgs_free_throws_made,
        freeThrowsAttempted: stat.pgs_free_throws_attempted,
        turnovers: stat.pgs_turnovers,
      });
    }, 0);
    const averageEfficiency = Math.round((totalEfficiency / gamesPlayed) * 10) / 10;

    // Calculate average minutes (this is tricky because minutes are stored as string like "25:30")
    let totalMinutes = 0;
    let validMinutesCount = 0;
    
    for (const stat of stats) {
      if (stat.pgs_minutes_played) {
        try {
          const [minutes, seconds] = stat.pgs_minutes_played.split(':').map(Number);
          if (!isNaN(minutes) && !isNaN(seconds)) {
            totalMinutes += minutes + (seconds / 60);
            validMinutesCount++;
          }
        } catch (error) {
          // Skip invalid minute formats
        }
      }
    }
    
    const averageMinutes = validMinutesCount > 0 ? 
      Math.round((totalMinutes / validMinutesCount) * 10) / 10 : 0;

    return {
      gamesPlayed,
      averageMinutes,
      averagePoints,
      averageFieldGoalsMade,
      averageFieldGoalsAttempted,
      fieldGoalPercentage,
      averageThreePointersMade,
      averageThreePointersAttempted,
      threePointPercentage,
      averageFreeThrowsMade,
      averageFreeThrowsAttempted,
      freeThrowPercentage,
      averageTotalRebounds,
      averageAssists,
      averageSteals,
      averageBlocks,
      averageTurnovers,
      averageFouls,
      averageEfficiency,
      totalPoints: totals.points,
      totalRebounds: totals.totalRebounds,
      totalAssists: totals.assists,
    };
  }
}