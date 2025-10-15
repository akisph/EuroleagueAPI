// euroleague-boxscore.dto.ts
import { 
  IsBoolean, IsString, IsNumber, IsArray, IsOptional, 
  ValidateNested, IsEnum, IsInt, Min, Matches 
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuarterStatsDto {
  @IsString()
  Team: string;

  @IsInt()
  @Min(0)
  Quarter1: number;

  @IsInt()
  @Min(0)
  Quarter2: number;

  @IsInt()
  @Min(0)
  Quarter3: number;

  @IsInt()
  @Min(0)
  Quarter4: number;
}

export class PlayerStatsDto {
  @IsString()
  @Matches(/^P\d{6}\s*$/)
  Player_ID: string;

  @IsInt()
  @IsEnum([0, 1])
  IsStarter: number;

  @IsInt()
  @IsEnum([0, 1])
  IsPlaying: number;

  @IsString()
  Team: string;

  @IsString()
  Dorsal: string;

  @IsString()
  Player: string;

  @IsOptional()
  @Matches(/^(\d{1,2}:\d{2}|DNP)$/)
  Minutes?: string | null;

  @IsInt()
  @Min(0)
  Points: number;

  @IsInt()
  @Min(0)
  FieldGoalsMade2: number;

  @IsInt()
  @Min(0)
  FieldGoalsAttempted2: number;

  @IsInt()
  @Min(0)
  FieldGoalsMade3: number;

  @IsInt()
  @Min(0)
  FieldGoalsAttempted3: number;

  @IsInt()
  @Min(0)
  FreeThrowsMade: number;

  @IsInt()
  @Min(0)
  FreeThrowsAttempted: number;

  @IsInt()
  @Min(0)
  OffensiveRebounds: number;

  @IsInt()
  @Min(0)
  DefensiveRebounds: number;

  @IsInt()
  @Min(0)
  TotalRebounds: number;

  @IsInt()
  @Min(0)
  Assistances: number;

  @IsInt()
  @Min(0)
  Steals: number;

  @IsInt()
  @Min(0)
  Turnovers: number;

  @IsInt()
  @Min(0)
  BlocksFavour: number;

  @IsInt()
  @Min(0)
  BlocksAgainst: number;

  @IsInt()
  @Min(0)
  FoulsCommited: number;

  @IsInt()
  @Min(0)
  FoulsReceived: number;

  @IsInt()
  Valuation: number;

  @IsOptional()
  @IsInt()
  Plusminus?: number | null;
}

export class TeamReboundsDto {
  @IsString()
  Player_ID: string;

  @IsInt()
  @IsEnum([0])
  IsStarter: 0;

  @IsInt()
  @IsEnum([0])
  IsPlaying: 0;

  @IsString()
  Team: string;

  @IsString()
  Dorsal: string;

  @IsString()
  Player: string;

  @IsOptional()
  Minutes: null;

  @IsInt()
  @IsEnum([0])
  Points: 0;

  @IsInt()
  @IsEnum([0])
  FieldGoalsMade2: 0;

  @IsInt()
  @IsEnum([0])
  FieldGoalsAttempted2: 0;

  @IsInt()
  @IsEnum([0])
  FieldGoalsMade3: 0;

  @IsInt()
  @IsEnum([0])
  FieldGoalsAttempted3: 0;

  @IsInt()
  @IsEnum([0])
  FreeThrowsMade: 0;

  @IsInt()
  @IsEnum([0])
  FreeThrowsAttempted: 0;

  @IsInt()
  @Min(0)
  OffensiveRebounds: number;

  @IsInt()
  @Min(0)
  DefensiveRebounds: number;

  @IsInt()
  @Min(0)
  TotalRebounds: number;

  @IsInt()
  @IsEnum([0])
  Assistances: 0;

  @IsInt()
  @IsEnum([0])
  Steals: 0;

  @IsInt()
  @IsEnum([0])
  Turnovers: 0;

  @IsInt()
  @IsEnum([0])
  BlocksFavour: 0;

  @IsInt()
  @IsEnum([0])
  BlocksAgainst: 0;

  @IsInt()
  @IsEnum([0])
  FoulsCommited: 0;

  @IsInt()
  @IsEnum([0])
  FoulsReceived: 0;

  @IsInt()
  @Min(0)
  Valuation: number;

  @IsOptional()
  Plusminus: null;
}

export class TeamTotalsDto {
  @IsString()
  @Matches(/^200:00$/)
  Minutes: string;

  @IsInt()
  @Min(0)
  Points: number;

  @IsInt()
  @Min(0)
  FieldGoalsMade2: number;

  @IsInt()
  @Min(0)
  FieldGoalsAttempted2: number;

  @IsInt()
  @Min(0)
  FieldGoalsMade3: number;

  @IsInt()
  @Min(0)
  FieldGoalsAttempted3: number;

  @IsInt()
  @Min(0)
  FreeThrowsMade: number;

  @IsInt()
  @Min(0)
  FreeThrowsAttempted: number;

  @IsInt()
  @Min(0)
  OffensiveRebounds: number;

  @IsInt()
  @Min(0)
  DefensiveRebounds: number;

  @IsInt()
  @Min(0)
  TotalRebounds: number;

  @IsInt()
  @Min(0)
  Assistances: number;

  @IsInt()
  @Min(0)
  Steals: number;

  @IsInt()
  @Min(0)
  Turnovers: number;

  @IsInt()
  @Min(0)
  BlocksFavour: number;

  @IsInt()
  @Min(0)
  BlocksAgainst: number;

  @IsInt()
  @Min(0)
  FoulsCommited: number;

  @IsInt()
  @Min(0)
  FoulsReceived: number;

  @IsInt()
  Valuation: number;
}

export class TeamStatsDto {
  @IsString()
  Team: string;

  @IsString()
  Coach: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerStatsDto)
  PlayersStats: PlayerStatsDto[];

  @ValidateNested()
  @Type(() => TeamReboundsDto)
  tmr: TeamReboundsDto;

  @ValidateNested()
  @Type(() => TeamTotalsDto)
  totr: TeamTotalsDto;
}

export class EuroleagueBoxscoreDto {
  @IsBoolean()
  Live: boolean;

  @IsOptional()
  @IsString()
  Referees?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  Attendance?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuarterStatsDto)
  ByQuarter: QuarterStatsDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuarterStatsDto)
  EndOfQuarter: QuarterStatsDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamStatsDto)
  Stats: TeamStatsDto[];
}
