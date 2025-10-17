import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../../entities/team.entity';
import { Game } from '../../entities/game.entity';
import { Season } from '../../entities/season.entity';
import { TeamStatsDto, AllTeamsStatsDto, GameStatsDto } from './dto/team-game-stats.dto';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(Season)
    private readonly seasonRepository: Repository<Season>,
  ) {}

  async getAllTeams(): Promise<Team[]> {
    this.logger.log('Getting all teams');
    const teams = await this.teamRepository.find({
      order: { tm_name: 'ASC' }
    });
    this.logger.debug(`Found ${teams.length} teams`);
    return teams;
  }



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

    // Fallback to latest season since there's no is_current field
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

async getAllTeamsStats(seasonCode?: string): Promise<AllTeamsStatsDto> {
    this.logger.log(`Getting all teams stats for season: ${seasonCode || 'current'}`);
    // Resolve season (use provided, or process.env.CURRENT_SEASON, or latest)
    const season = await this.resolveSeason(seasonCode);
    this.logger.debug(`Resolved season: ${season.ssn_code}`);

    // Get all teams
    const teams = await this.teamRepository.find({
        order: { tm_name: 'ASC' },
    });
    this.logger.debug(`Found ${teams.length} teams to process`);

    const teamsStats: TeamStatsDto[] = [];

    for (const team of teams) {
        this.logger.debug(`Processing stats for team: ${team.tm_name} (${team.tm_id})`);
        const teamStats = await this.getTeamStats(team.tm_id, season.ssn_code);
        this.logger.debug(`Fetched stats for team ${team.tm_name} (${team.tm_id}) for season ${season.ssn_code} - ${teamStats.games.length} games`);
        if (teamStats.games && teamStats.games.length > 0) {
            teamsStats.push(teamStats);
        } else {
            this.logger.debug(`No games found for team ${team.tm_name}, skipping`);
        }
    }

    this.logger.log(`Completed processing stats for ${teamsStats.length} teams with games in season ${season.ssn_code}`);
    return {
        season: season.ssn_code,
        totalTeams: teams.length,
        teams: teamsStats,
    };
}

async getTeamStats(teamId: number, seasonCode?: string): Promise<TeamStatsDto> {
    this.logger.log(`Getting team stats for team ID: ${teamId}, season: ${seasonCode || 'current'}`);
    const team = await this.teamRepository.findOne({
        where: { tm_id: teamId },
    });

    if (!team) {
        this.logger.debug(`Team with ID ${teamId} not found`);
        throw new NotFoundException(`Team with ID ${teamId} not found`);
    }
    this.logger.debug(`Found team: ${team.tm_name} (${team.tm_code})`);

    // Resolve season (use provided, or process.env.CURRENT_SEASON, or latest)
    const season = await this.resolveSeason(seasonCode);
    this.logger.debug(`Processing stats for season: ${season.ssn_code}`);

    // Get all games for the team in the specified season
    this.logger.debug(`Fetching games for team ${team.tm_name} in season ${season.ssn_code}`);
    const games = await this.gameRepository.find({
        where: [
            {
                gm_fk_ssn_id: season.ssn_id,
                gm_fk_home_tm_id: teamId,
            },
            {
                gm_fk_ssn_id: season.ssn_id,
                gm_fk_away_tm_id: teamId,
            },
        ],
        relations: ['homeTeam', 'awayTeam', 'season'],
        order: { gm_date: 'ASC' },
    });
    this.logger.debug(`Found ${games.length} games for team ${team.tm_name}`);

    const gameStats: GameStatsDto[] = [];
    let wins = 0;
    let losses = 0;
    let homeGames = 0;
    let awayGames = 0;
    let totalPointsScored = 0;
    let totalPointsAllowed = 0;

    this.logger.debug(`Processing ${games.length} games for team ${team.tm_name}`);
    for (const game of games) {
        const isHomeGame = game.gm_fk_home_tm_id === teamId;
        const opponent = isHomeGame ? game.awayTeam : game.homeTeam;
        const teamScore = isHomeGame ? game.gm_home_score : game.gm_away_score;
        const opponentScore = isHomeGame ? game.gm_away_score : game.gm_home_score;

        this.logger.debug(`Processing game ${game.gm_code}: ${team.tm_name} vs ${opponent.tm_name} (${isHomeGame ? 'Home' : 'Away'})`);

        // Count wins/losses and points only for finished games with valid scores
        if (game.gm_status === 'Completed' && teamScore !== null && opponentScore !== null) {
            // Add to point totals
            totalPointsScored += teamScore;
            totalPointsAllowed += opponentScore;
            
            if (teamScore > opponentScore) {
                wins++;
                this.logger.debug(`Win recorded: ${teamScore}-${opponentScore} (+${teamScore - opponentScore})`);
            } else {
                losses++;
                this.logger.debug(`Loss recorded: ${teamScore}-${opponentScore} (${teamScore - opponentScore})`);
            }
        } else {
            this.logger.debug(`Game not completed or scores missing: ${game.gm_status}`);
        }

        if (isHomeGame) {
            homeGames++;
        } else {
            awayGames++;
        }

        const gameStatDto: GameStatsDto = {
            gameId: game.gm_id,
            gameCode: game.gm_code,
            date: game.gm_date,
            status: game.gm_status,
            isHomeGame,
            venue: isHomeGame ? `${team.tm_city}, ${team.tm_country}` : `${opponent.tm_city}, ${opponent.tm_country}`,
            opponent: {
                id: opponent.tm_id,
                code: opponent.tm_code,
                name: opponent.tm_name,
                city: opponent.tm_city || '',
                country: opponent.tm_country || '',
            },
            score: {
                team: teamScore || 0,
                opponent: opponentScore || 0,
            },
            seasonCode: season.ssn_code,
            // Note: Referee and attendance data would need to be added to the database schema
            // For now, these fields will be undefined
            referees: undefined,
            attendance: undefined,
        };

        gameStats.push(gameStatDto);
    }

    const pointDifferential = totalPointsScored - totalPointsAllowed;
    this.logger.log(`Completed stats calculation for ${team.tm_name}: ${wins}W-${losses}L (${games.length} total games, ${homeGames} home, ${awayGames} away), Points: ${totalPointsScored}-${totalPointsAllowed} (+/- ${pointDifferential > 0 ? '+' : ''}${pointDifferential})`);
    
    return {
        team: {
            id: team.tm_id,
            code: team.tm_code,
            name: team.tm_name,
            city: team.tm_city || '',
            country: team.tm_country || '',
        },
        totalGames: games.length,
        homeGames,
        awayGames,
        wins,
        losses,
        pointsScored: totalPointsScored,
        pointsAllowed: totalPointsAllowed,
        pointDifferential,
        games: gameStats,
    };
}

}