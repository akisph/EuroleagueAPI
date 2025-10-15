// euroleague-playbyplay.dto.ts
import { 
  IsString, IsNumber, IsArray, IsOptional, 
  ValidateNested, IsEnum, IsInt, Min, Max, Matches 
} from 'class-validator';
import { Type } from 'class-transformer';

export class PlayActionDto {
  @IsInt()
  @Min(1)
  NUMBEROFPLAY: number;

  @IsString()
  CODETEAM: string;

  @IsString()
  PLAYTYPE: string;

  @IsOptional()
  @IsString()
  TEAM?: string;

  @IsOptional()
  @IsString()
  PLAYER?: string;

  @IsOptional()
  @IsString()
  @Matches(/^P\d{6}\s*$/)
  PLAYER_ID?: string;

  @IsOptional()
  @IsString()
  DORSAL?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  MINUTE?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  MARKERTIME?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+-\d+$/)
  SCORE?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  SCOREA?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  SCOREB?: number;

  @IsOptional()
  @IsString()
  COMMENT?: string;
}

export class EuroleaguePlaybyPlayDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayActionDto)
  FirstQuarter: PlayActionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayActionDto)
  SecondQuarter: PlayActionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayActionDto)
  ThirdQuarter: PlayActionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayActionDto)
  FourthQuarter: PlayActionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayActionDto)
  ExtraTime?: PlayActionDto[];
}
