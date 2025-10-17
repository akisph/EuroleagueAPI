import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../../entities/team.entity';
import { Game } from '../../entities/game.entity';
import { Season } from '../../entities/season.entity';
import { TeamStatsDto, AllTeamsStatsDto, GameStatsDto } from './dto/team-game-stats.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(Season)
    private readonly seasonRepository: Repository<Season>,
  ) {}

  async getAllTeams(): Promise<Team[]> {
    return this.teamRepository.find({
      order: { tm_name: 'ASC' }
    });
  }



private async resolveSeason(seasonCode?: string): Promise<Season> {
    const code = seasonCode ?? process.env.CURRENT_SEASON;
    if (code) {
        const season = await this.seasonRepository.findOne({
            where: { ssn_code: code },
        });
        if (!season) {
            throw new NotFoundException(`Season ${code} not found`);
        }
        return season;
    }

    // Fallback to latest season since there's no is_current field
    const latestSeason = await this.seasonRepository.findOne({
        order: { ssn_created_at: 'DESC' },
    });
    if (!latestSeason) {
        throw new NotFoundException('No season found');
    }
    return latestSeason;
}

async getAllTeamsStats(seasonCode?: string): Promise<AllTeamsStatsDto> {
    // Resolve season (use provided, or process.env.CURRENT_SEASON, or latest)
    const season = await this.resolveSeason(seasonCode);

    // Get all teams
    const teams = await this.teamRepository.find({
        order: { tm_name: 'ASC' },
    });

    const teamsStats: TeamStatsDto[] = [];

    for (const team of teams) {
        const teamStats = await this.getTeamStats(team.tm_id, season.ssn_code);
        console.debug(`Fetched stats for team ${team.tm_name} (${team.tm_id}) for season ${season.ssn_code}`, teamStats.games.length);
        if (teamStats.games && teamStats.games.length > 0) {
            teamsStats.push(teamStats);
        }
    }

    return {
        season: season.ssn_code,
        totalTeams: teams.length,
        teams: teamsStats,
    };
}

async getTeamStats(teamId: number, seasonCode?: string): Promise<TeamStatsDto> {
    const team = await this.teamRepository.findOne({
        where: { tm_id: teamId },
    });

    if (!team) {
        throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    // Resolve season (use provided, or process.env.CURRENT_SEASON, or latest)
    const season = await this.resolveSeason(seasonCode);

    // Get all games for the team in the specified season
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

    const gameStats: GameStatsDto[] = [];
    let wins = 0;
    let losses = 0;
    let homeGames = 0;
    let awayGames = 0;

    for (const game of games) {
        const isHomeGame = game.gm_fk_home_tm_id === teamId;
        const opponent = isHomeGame ? game.awayTeam : game.homeTeam;
        const teamScore = isHomeGame ? game.gm_home_score : game.gm_away_score;
        const opponentScore = isHomeGame ? game.gm_away_score : game.gm_home_score;

        // Count wins/losses only for finished games
        if (game.gm_status === 'Completed' && teamScore !== null && opponentScore !== null) {
            if (teamScore > opponentScore) {
                wins++;
            } else {
                losses++;
            }
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
        games: gameStats,
    };
}

}