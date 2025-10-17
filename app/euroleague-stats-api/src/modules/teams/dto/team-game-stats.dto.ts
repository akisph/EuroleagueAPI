export class GameStatsDto {
  gameId: number;
  gameCode: number;
  date: Date;
  status: string;
  isHomeGame: boolean;
  venue?: string;
  opponent: {
    id: number;
    code: string;
    name: string;
    city: string;
    country: string;
  };
  score: {
    team: number;
    opponent: number;
  };
  referees?: string;
  attendance?: string;
  seasonCode: string;
}

export class TeamStatsDto {
  team: {
    id: number;
    code: string;
    name: string;
    city: string;
    country: string;
  };
  totalGames: number;
  homeGames: number;
  awayGames: number;
  wins: number;
  losses: number;
  games: GameStatsDto[];
}

export class AllTeamsStatsDto {
  season: string;
  totalTeams: number;
  teams: TeamStatsDto[];
}