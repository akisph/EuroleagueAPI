export class PlayerBasicInfoDto {
  id: number;
  code: string;
  firstName: string;
  lastName: string;
  position?: string;
}

export class PlayerGameStatsDto {
  gameId: number;
  gameCode: string;
  date: Date;
  status: string;
  isHomeGame: boolean;
  opponent: {
    id: number;
    code: string;
    name: string;
    city: string;
    country: string;
  };
  minutesPlayed?: string;
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPercentage: number;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointPercentage: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPercentage: number;
  totalRebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  efficiency: number;
}

export class PlayerSeasonAveragesDto {
  gamesPlayed: number;
  gamesStarted?: number;
  averageMinutes: number;
  averagePoints: number;
  averageFieldGoalsMade: number;
  averageFieldGoalsAttempted: number;
  fieldGoalPercentage: number;
  averageThreePointersMade: number;
  averageThreePointersAttempted: number;
  threePointPercentage: number;
  averageFreeThrowsMade: number;
  averageFreeThrowsAttempted: number;
  freeThrowPercentage: number;
  averageTotalRebounds: number;
  averageAssists: number;
  averageSteals: number;
  averageBlocks: number;
  averageTurnovers: number;
  averageFouls: number;
  averageEfficiency: number;
  totalPoints: number;
  totalRebounds: number;
  totalAssists: number;
}

export class PlayerStatsDto {
  player: PlayerBasicInfoDto;
  team: {
    id: number;
    code: string;
    name: string;
    city: string;
    country: string;
  };
  season: string;
  seasonAverages: PlayerSeasonAveragesDto;
  games: PlayerGameStatsDto[];
}

export class TeamPlayersStatsDto {
  team: {
    id: number;
    code: string;
    name: string;
    city: string;
    country: string;
  };
  season: string;
  totalPlayers: number;
  players: Array<{
    player: PlayerBasicInfoDto;
    seasonAverages: PlayerSeasonAveragesDto;
  }>;
}