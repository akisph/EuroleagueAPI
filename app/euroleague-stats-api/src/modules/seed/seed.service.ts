import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Season, Team, Player, Game, PlayerGameStats, TeamGameStats, ScoringEvent } from '../../entities';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface BoxscorePlayer {
  Player_ID: string;
  Player: string;
  Team: string;
  Minutes: string;
  Points: number;
  FieldGoalsMade2: number;
  FieldGoalsAttempted2: number;
  FieldGoalsMade3: number;
  FieldGoalsAttempted3: number;
  FreeThrowsMade: number;
  FreeThrowsAttempted: number;
  OffensiveRebounds: number;
  DefensiveRebounds: number;
  TotalRebounds: number;
  Assistances: number;
  Steals: number;
  Turnovers: number;
  BlocksFavour: number;
  BlocksAgainst: number;
  FoulsCommited: number;
  FoulsReceived: number;
  Valuation: number;
  IsStarter: number;
  IsPlaying: number;
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);
  private readonly SEASONS = [ 'E2025', 'E2024', 'E2023', 'E2022', 'E2021', 'E2020', 'E2019', 'E2018' ];
  private readonly API_BASE_URL = 'https://live.euroleague.net/api';
  private readonly DELAY_BETWEEN_REQUESTS = 500; // 500ms delay
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectRepository(Season)
    private seasonRepository: Repository<Season>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(PlayerGameStats)
    private playerGameStatsRepository: Repository<PlayerGameStats>,
    @InjectRepository(TeamGameStats)
    private teamGameStatsRepository: Repository<TeamGameStats>,
    @InjectRepository(ScoringEvent)
    private scoringEventRepository: Repository<ScoringEvent>,
  ) {}

  async initializeSeeding() {
    this.logger.log('🏀 Starting Euroleague API seeding process...');
    
    try {
      // Initialize seasons first
      await this.initializeSeasons();
      
      // Process each season
      for (const seasonCode of this.SEASONS) {
        this.logger.log(`📅 Processing season: ${seasonCode}`);
        await this.seedSeasonData(seasonCode);
      }
      
      this.logger.log('✅ Seeding completed successfully!');
    } catch (error) {
      this.logger.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  private async initializeSeasons() {
    this.logger.log('🔄 Initializing seasons...');
    

    for (const seasonCode of this.SEASONS) {
      const existingSeason = await this.seasonRepository.findOne({ 
        where: { ssn_code: seasonCode } 
      });
      
      if (!existingSeason) {
        const yearMatch = seasonCode.match(/\d+/);
        let seasonName = seasonCode;
        if (yearMatch) {
          const year = parseInt(yearMatch[0], 10);
          const nextYear = year + 1;
          const nextYearShort = (nextYear % 100).toString().padStart(2, '0');
          seasonName = `${year}-${nextYearShort} Season`;
        }
        
        const season = await this.seasonRepository.create({
          ssn_code: seasonCode,
          ssn_name: seasonName,
        });
        

        await this.seasonRepository.save(season);
        // await this.seasonRepository.save(season);
        this.logger.log(`✅ Created season: ${seasonCode}`);
      } else {
        this.logger.log(`📋 Season ${seasonCode} already exists`);
      }
    }
  }

  private async seedSeasonData(seasonCode: string) {
    this.logger.log(`🔄 Seeding data for season: ${seasonCode}`);
    const season = await this.seasonRepository.findOne({ 
      where: { ssn_code: seasonCode } 
    });
    
    if (!season) {
      throw new Error(`Season ${seasonCode} not found`);
    }

    let gameCode = 1;
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 2; // Stop after 1 consecutive failure //!importany
    
    this.logger.log(`🔍 Starting to fetch games for season ${seasonCode}...`);
    
    while (consecutiveFailures < maxConsecutiveFailures) {
      this.logger.log(`🏀 Processing game ${gameCode} for season ${seasonCode}`);
      
      // Check if game already exists
      const existingGame = await this.gameRepository.findOne({
        where: { gm_code: gameCode, gm_fk_ssn_id: season.ssn_id }
      });
      
      if (existingGame) {
        this.logger.log(`📋 Game ${gameCode} already exists, skipping...`);
        gameCode++;
        consecutiveFailures = 0; // Reset counter for existing games
        continue;
      }
      
      // Try to fetch game data
      const boxscoreResponse = await this.fetchGameData('Boxscore', gameCode, seasonCode);
      

      if (!boxscoreResponse.success) {
        this.logger.warn(`❌ Failed to fetch game ${gameCode}: ${boxscoreResponse.error}`);
        consecutiveFailures++;
        gameCode++;
        continue;
      }
      
      // Reset consecutive failures since we got data
      consecutiveFailures = 0;
      
      try {
        // Process the game data
        await this.processGameData(gameCode, seasonCode, season, boxscoreResponse.data);
      } catch (error) {
        this.logger.error(`❌ Error processing game ${gameCode}:`, error.message);
        // Continue to next game even if this one fails
      }
      
      gameCode++;
      
      // Add delay between requests
      await this.delay(this.DELAY_BETWEEN_REQUESTS);
    }
    
    this.logger.log(`🏁 Finished processing season ${seasonCode}. Last game attempted: ${gameCode - 1}`);
  }

  private async processGameData(gameCode: number, seasonCode: string, season: Season, boxscoreData: any) {
    // Check if game already exists to prevent duplicates
    const existingGame = await this.gameRepository.findOne({
      where: { gm_code: gameCode, gm_fk_ssn_id: season.ssn_id }
    });
    
    if (existingGame) {
      this.logger.debug(`📋 Game ${gameCode} already exists in season ${seasonCode}, skipping processing...`);
      return;
    }
    
    // Extract teams from boxscore data
    const teamA = boxscoreData.Stats[0];
    const teamB = boxscoreData.Stats[1];
    
    // Get team codes from player data (first player's team code)
    const teamACode = teamA.PlayersStats.find(p => p.Team)?.Team || teamA.Team.substring(0, 10);
    const teamBCode = teamB.PlayersStats.find(p => p.Team)?.Team || teamB.Team.substring(0, 10);
    
    // Create or get teams using proper short codes
    const homeTeam = await this.createOrGetTeam(teamACode, teamA.Team);
    const awayTeam = await this.createOrGetTeam(teamBCode, teamB.Team);
    
    // Get scores from EndOfQuarter data
    const finalQuarter = boxscoreData.EndOfQuarter;
    const homeScore = finalQuarter.find(q => q.Team === teamA.Team)?.Quarter4 || 0;
    const awayScore = finalQuarter.find(q => q.Team === teamB.Team)?.Quarter4 || 0;
    
    // Create game with duplicate handling
    let savedGame;
    try {
      const game = this.gameRepository.create({
        gm_code: gameCode,
        gm_fk_ssn_id: season.ssn_id,
        gm_fk_home_tm_id: homeTeam.tm_id,
        gm_fk_away_tm_id: awayTeam.tm_id,
        gm_home_score: homeScore,
        gm_away_score: awayScore,
        gm_status: 'Completed',
        gm_date: new Date() // You might want to extract actual date from API if available
      });
      
      savedGame = await this.gameRepository.save(game);
      this.logger.log(`✅ Successfully processed game ${gameCode}: ${teamA.Team} vs ${teamB.Team}`);
    } catch (error) {
      if (error.message.includes('duplicate key value violates unique constraint')) {
        // Game was created by another process, fetch it
        savedGame = await this.gameRepository.findOne({
          where: { gm_code: gameCode, gm_fk_ssn_id: season.ssn_id }
        });
        if (!savedGame) {
          throw new Error(`Failed to create or find game ${gameCode} for season ${seasonCode}`);
        }
        this.logger.debug(`🔄 Game ${gameCode} was created by another process, using existing record`);
      } else {
        throw error;
      }
    }
    
    // Process players and stats for both teams
    await this.processTeamStats(savedGame, homeTeam, teamA);
    await this.processTeamStats(savedGame, awayTeam, teamB);
    
    // Fetch and process scoring events (Points endpoint)
    await this.processPointsData(savedGame, gameCode, seasonCode);
  }

  private async processTeamStats(game: Game, team: Team, teamData: any) {
    // Check if team stats already exist
    const existingTeamStats = await this.teamGameStatsRepository.findOne({
      where: { tmgs_fk_gm_id: game.gm_id, tmgs_fk_tm_id: team.tm_id }
    });
    
    if (!existingTeamStats) {
      try {
        // Create team game stats
        const teamStats = this.teamGameStatsRepository.create({
          tmgs_fk_gm_id: game.gm_id,
          tmgs_fk_tm_id: team.tm_id,
          tmgs_points: teamData.PlayersStats.reduce((sum, p) => sum + (p.Points || 0), 0),
          tmgs_field_goals_made: teamData.PlayersStats.reduce((sum, p) => sum + (p.FieldGoalsMade2 || 0) + (p.FieldGoalsMade3 || 0), 0),
          tmgs_field_goals_attempted: teamData.PlayersStats.reduce((sum, p) => sum + (p.FieldGoalsAttempted2 || 0) + (p.FieldGoalsAttempted3 || 0), 0),
          tmgs_three_pointers_made: teamData.PlayersStats.reduce((sum, p) => sum + (p.FieldGoalsMade3 || 0), 0),
          tmgs_three_pointers_attempted: teamData.PlayersStats.reduce((sum, p) => sum + (p.FieldGoalsAttempted3 || 0), 0),
          tmgs_free_throws_made: teamData.PlayersStats.reduce((sum, p) => sum + (p.FreeThrowsMade || 0), 0),
          tmgs_free_throws_attempted: teamData.PlayersStats.reduce((sum, p) => sum + (p.FreeThrowsAttempted || 0), 0),
          tmgs_total_rebounds: teamData.PlayersStats.reduce((sum, p) => sum + (p.TotalRebounds || 0), 0),
          tmgs_assists: teamData.PlayersStats.reduce((sum, p) => sum + (p.Assistances || 0), 0),
          tmgs_steals: teamData.PlayersStats.reduce((sum, p) => sum + (p.Steals || 0), 0),
          tmgs_blocks: teamData.PlayersStats.reduce((sum, p) => sum + (p.BlocksFavour || 0), 0),
          tmgs_turnovers: teamData.PlayersStats.reduce((sum, p) => sum + (p.Turnovers || 0), 0),
          tmgs_fouls: teamData.PlayersStats.reduce((sum, p) => sum + (p.FoulsCommited || 0), 0)
        });
        
        await this.teamGameStatsRepository.save(teamStats);
      } catch (error) {
        if (error.message.includes('duplicate key value violates unique constraint')) {
          this.logger.debug(`🔄 Team stats for game ${game.gm_code} and team ${team.tm_code} already exist, skipping...`);
        } else {
          throw error;
        }
      }
    }
    
    // Process individual player stats
    for (const playerData of teamData.PlayersStats) {
      await this.processPlayerStats(game, team, playerData);
    }
  }

  private async processPlayerStats(game: Game, team: Team, playerData: BoxscorePlayer) {
    // Create or get player
    const playerNames = playerData.Player.split(', ');
    const firstName = playerNames[1] || playerData.Player;
    const lastName = playerNames[0] || '';
    
    const player = await this.createOrGetPlayer(
      playerData.Player_ID.trim(),
      firstName,
      lastName
    );
    
    // Check if player stats already exist
    const existingPlayerStats = await this.playerGameStatsRepository.findOne({
      where: { 
        pgs_fk_gm_id: game.gm_id, 
        pgs_fk_plr_id: player.plr_id, 
        pgs_fk_tm_id: team.tm_id 
      }
    });
    
    if (!existingPlayerStats) {
      try {
        // Create player game stats
        const playerStats = this.playerGameStatsRepository.create({
          pgs_fk_gm_id: game.gm_id,
          pgs_fk_plr_id: player.plr_id,
          pgs_fk_tm_id: team.tm_id,
          pgs_minutes_played: playerData.Minutes,
          pgs_points: playerData.Points || 0,
          pgs_field_goals_made: (playerData.FieldGoalsMade2 || 0) + (playerData.FieldGoalsMade3 || 0),
          pgs_field_goals_attempted: (playerData.FieldGoalsAttempted2 || 0) + (playerData.FieldGoalsAttempted3 || 0),
          pgs_three_pointers_made: playerData.FieldGoalsMade3 || 0,
          pgs_three_pointers_attempted: playerData.FieldGoalsAttempted3 || 0,
          pgs_free_throws_made: playerData.FreeThrowsMade || 0,
          pgs_free_throws_attempted: playerData.FreeThrowsAttempted || 0,
          pgs_total_rebounds: playerData.TotalRebounds || 0,
          pgs_assists: playerData.Assistances || 0,
          pgs_steals: playerData.Steals || 0,
          pgs_blocks: playerData.BlocksFavour || 0,
          pgs_turnovers: playerData.Turnovers || 0,
          pgs_fouls: playerData.FoulsCommited || 0
        });
        
        await this.playerGameStatsRepository.save(playerStats);
      } catch (error) {
        if (error.message.includes('duplicate key value violates unique constraint')) {
          this.logger.debug(`🔄 Player stats for game ${game.gm_code}, player ${player.plr_code} already exist, skipping...`);
        } else {
          throw error;
        }
      }
    }
  }

  private async processPointsData(game: Game, gameCode: number, seasonCode: string) {
    const pointsResponse = await this.fetchGameData('Points', gameCode, seasonCode);
    
    if (!pointsResponse.success || !pointsResponse.data?.Rows) {
      this.logger.warn(`No points data available for game ${gameCode}`);
      return;
    }
    
    for (const pointEvent of pointsResponse.data.Rows) {
      // Get player and team
      const player = await this.playerRepository.findOne({
        where: { plr_code: pointEvent.ID_PLAYER.trim() }
      });
      
      const team = await this.teamRepository.findOne({
        where: { tm_code: pointEvent.TEAM.trim() }
      });
      
      if (player && team) {
        try {
          const scoringEvent = this.scoringEventRepository.create({
            sc_fk_gm_id: game.gm_id,
            sc_fk_plr_id: player.plr_id,
            sc_fk_tm_id: team.tm_id,
            sc_shot_type: pointEvent.ID_ACTION,
            sc_points_scored: pointEvent.POINTS || 0,
            sc_period: pointEvent.MINUTE || 0,
            sc_is_made: pointEvent.POINTS > 0
          });
          
          await this.scoringEventRepository.save(scoringEvent);
        } catch (error) {
          if (error.message.includes('duplicate key value violates unique constraint')) {
            this.logger.debug(`🔄 Scoring event for game ${game.gm_code}, player ${player.plr_code} already exists, skipping...`);
          } else {
            this.logger.warn(`⚠️ Failed to save scoring event for game ${gameCode}: ${error.message}`);
          }
        }
      }
    }
  }

  private async createOrGetTeam(teamCode: string, teamName: string): Promise<Team> {
    let team = await this.teamRepository.findOne({
      where: { tm_code: teamCode }
    });
    
    if (!team) {
      try {
        team = this.teamRepository.create({
          tm_code: teamCode,
          tm_name: teamName
        });
        team = await this.teamRepository.save(team);
        this.logger.log(`✅ Created team: ${teamName}`);
      } catch (error) {
        // Handle race condition - another process might have created the team
        if (error.message.includes('duplicate key value violates unique constraint')) {
          this.logger.debug(`🔄 Team ${teamCode} was created by another process, fetching...`);
          team = await this.teamRepository.findOne({
            where: { tm_code: teamCode }
          });
          if (!team) {
            throw new Error(`Failed to create or find team with code: ${teamCode}`);
          }
        } else {
          throw error;
        }
      }
    }
    
    return team;
  }

  private async createOrGetPlayer(playerCode: string, firstName: string, lastName: string): Promise<Player> {
    let player = await this.playerRepository.findOne({
      where: { plr_code: playerCode }
    });
    
    if (!player) {
      try {
        player = this.playerRepository.create({
          plr_code: playerCode,
          plr_first_name: firstName,
          plr_last_name: lastName
        });
        player = await this.playerRepository.save(player);
        this.logger.log(`✅ Created player: ${firstName} ${lastName}`);
      } catch (error) {
        // Handle race condition - another process might have created the player
        if (error.message.includes('duplicate key value violates unique constraint')) {
          this.logger.debug(`🔄 Player ${playerCode} was created by another process, fetching...`);
          player = await this.playerRepository.findOne({
            where: { plr_code: playerCode }
          });
          if (!player) {
            throw new Error(`Failed to create or find player with code: ${playerCode}`);
          }
        } else {
          throw error;
        }
      }
    }
    
    return player;
  }

  private async fetchGameData(endpoint: string, gameCode: number, seasonCode: string): Promise<ApiResponse> {
    const url = `${this.API_BASE_URL}/${endpoint}?gamecode=${gameCode}&seasoncode=${seasonCode}`;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'EuroleagueStatsAPI/1.0'
          },
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        
        if (response.status === 404) {
          return { success: false, error: 'Game not found (404)' };
        }
        
        if (response.status === 406) {
          return { success: false, error: 'Endpoint not accessible (406)' };
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return { success: true, data };
        
      } catch (error) {
        this.logger.warn(`Attempt ${attempt}/${this.MAX_RETRIES} failed for ${endpoint} game ${gameCode}: ${error.message}`);
        
        if (attempt === this.MAX_RETRIES) {
          return { success: false, error: error.message };
        }
        
        // Exponential backoff
        await this.delay(1000 * attempt);
      }
    }
    
    return { success: false, error: 'Max retries exceeded' };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  async updateSeedingData() {
    this.logger.log('🔄 Starting Euroleague API update process...');
    
    try {
      // First, check for new seasons that might have been added
      await this.checkAndAddNewSeasons();
      
      // Then, update each existing season with new games
      const existingSeasons = await this.seasonRepository.find();
      
      for (const season of existingSeasons) {
        this.logger.log(`🔍 Checking for new games in season: ${season.ssn_code}`);
        await this.updateSeasonWithNewGames(season);
      }
      
      this.logger.log('✅ Update process completed successfully!');
    } catch (error) {
      this.logger.error('❌ Update process failed:', error);
      throw error;
    }
  }

  private async checkAndAddNewSeasons() {
    this.logger.log('🔍 Checking for new seasons...');
    
    // List of potential seasons to check (you can expand this as needed)
    const potentialSeasons = ['E2023', 'E2024', 'E2025', 'E2026'];
    
    for (const seasonCode of potentialSeasons) {
      const existingSeason = await this.seasonRepository.findOne({
        where: { ssn_code: seasonCode }
      });
      
      if (!existingSeason) {
        // Test if this season exists by trying to fetch game 1
        const testResponse = await this.fetchGameData('Boxscore', 1, seasonCode);
        
        if (testResponse.success) {
          // Season exists! Create it and seed its data
          this.logger.log(`🆕 Found new season: ${seasonCode}`);
          await this.createSeason(seasonCode);
          await this.seedSeasonData(seasonCode);
        } else {
          this.logger.debug(`❌ Season ${seasonCode} not available: ${testResponse.error}`);
        }
      }
    }
  }

  private async createSeason(seasonCode: string) {
    const yearMatch = seasonCode.match(/\d+/);
    let seasonName = seasonCode;
    if (yearMatch) {
      const year = parseInt(yearMatch[0], 10);
      const nextYear = year + 1;
      const nextYearShort = (nextYear % 100).toString().padStart(2, '0');
      seasonName = `${year}-${nextYearShort} Season`;
    }
    
    const season = this.seasonRepository.create({
      ssn_code: seasonCode,
      ssn_name: seasonName
    });
    
    await this.seasonRepository.save(season);
    this.logger.log(`✅ Created new season: ${seasonCode}`);
  }

  private async updateSeasonWithNewGames(season: Season) {
    this.logger.log(`🔄 Updating season ${season.ssn_code} with new games...`);
    
    // Find the highest game code already in the database for this season
    const lastGame = await this.gameRepository
      .createQueryBuilder('game')
      .where('game.gm_fk_ssn_id = :seasonId', { seasonId: season.ssn_id })
      .orderBy('game.gm_code', 'DESC')
      .getOne();
    
    let startingGameCode = lastGame ? lastGame.gm_code + 1 : 1;
    let consecutiveFetchFailures = 0;
    let consecutiveProcessFailures = 0;
    const maxConsecutiveFetchFailures = 3;
    const maxConsecutiveProcessFailures = 3;
    let newGamesFound = 0;
    
    this.logger.log(`🎯 Starting search from game ${startingGameCode} for season ${season.ssn_code}`);
    
    while (consecutiveFetchFailures < maxConsecutiveFetchFailures && consecutiveProcessFailures < maxConsecutiveProcessFailures) {
      const gameCode = startingGameCode;
      
      // Check if this game already exists (shouldn't happen but safety check)
      const existingGame = await this.gameRepository.findOne({
        where: { gm_code: gameCode, gm_fk_ssn_id: season.ssn_id }
      });
      
      if (existingGame) {
        this.logger.debug(`📋 Game ${gameCode} already exists, skipping...`);
        startingGameCode++;
        consecutiveFetchFailures = 0;
        consecutiveProcessFailures = 0;
        continue;
      }
      
      // Try to fetch new game data
      const boxscoreResponse = await this.fetchGameData('Boxscore', gameCode, season.ssn_code);
      
      if (!boxscoreResponse.success) {
        this.logger.debug(`❌ No new game found at ${gameCode}: ${boxscoreResponse.error}`);
        consecutiveFetchFailures++;
        startingGameCode++;
        continue;
      }
      
      // Found a new game! Reset fetch failure counter
      consecutiveFetchFailures = 0;
      
      try {
        await this.processGameData(gameCode, season.ssn_code, season, boxscoreResponse.data);
        this.logger.log(`🆕 Added new game ${gameCode} to season ${season.ssn_code}`);
        newGamesFound++;
        consecutiveProcessFailures = 0; // Reset process failure counter on success
      } catch (error) {
        this.logger.error(`❌ Error processing new game ${gameCode}:`, error.message);
        consecutiveProcessFailures++;
        
        // Check if it's a duplicate key error - if so, skip this game and continue
        if (error.message.includes('duplicate key value violates unique constraint')) {
          this.logger.warn(`⚠️ Duplicate constraint violation for game ${gameCode}, skipping...`);
          consecutiveProcessFailures = 0; // Don't count duplicates as processing failures
        } else if (consecutiveProcessFailures >= maxConsecutiveProcessFailures) {
          this.logger.error(`🛑 Stopping update for season ${season.ssn_code} after ${maxConsecutiveProcessFailures} consecutive processing failures`);
          break;
        }
      }
      
      startingGameCode++;
      
      // Add delay between requests
      await this.delay(this.DELAY_BETWEEN_REQUESTS);
    }
    
    if (consecutiveFetchFailures >= maxConsecutiveFetchFailures) {
      this.logger.log(`🛑 Stopped searching after ${maxConsecutiveFetchFailures} consecutive fetch failures for season ${season.ssn_code}`);
    }
    
    if (newGamesFound > 0) {
      this.logger.log(`✅ Found and added ${newGamesFound} new games to season ${season.ssn_code}`);
    } else {
      this.logger.log(`📋 No new games found for season ${season.ssn_code}`);
    }
  }
  
}
