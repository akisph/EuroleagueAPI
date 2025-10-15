import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Game } from './game.entity';
import { PlayerGameStats } from './player-game-stats.entity';
import { TeamGameStats } from './team-game-stats.entity';
import { ScoringEvent } from './scoring-event.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn()
  tm_id: number;

  @Column({ type: 'varchar', length: 10, unique: true })
  tm_code: string;

  @Column({ type: 'varchar', length: 100 })
  tm_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tm_city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tm_country: string;

  @CreateDateColumn()
  tm_created_at: Date;

  @OneToMany(() => Game, game => game.homeTeam)
  homeGames: Game[];

  @OneToMany(() => Game, game => game.awayTeam)
  awayGames: Game[];

  @OneToMany(() => PlayerGameStats, stats => stats.team)
  playerGameStats: PlayerGameStats[];

  @OneToMany(() => TeamGameStats, stats => stats.team)
  teamGameStats: TeamGameStats[];

  @OneToMany(() => ScoringEvent, event => event.team)
  scoringEvents: ScoringEvent[];
}