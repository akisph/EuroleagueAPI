// Table: players
// Purpose: Stores player master data (code, name, position). Acts as the
// canonical player record referenced by game-statistics and scoring events.
// Relationships:
//  - PlayerGameStats (One player -> many per-game stat rows)
//  - ScoringEvent (One player -> many scoring events)
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { PlayerGameStats } from './player-game-stats.entity';
import { ScoringEvent } from './scoring-event.entity';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn()
  plr_id: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  plr_code: string;

  @Column({ type: 'varchar', length: 100 })
  plr_first_name: string;

  @Column({ type: 'varchar', length: 100 })
  plr_last_name: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  plr_position: string;

  @CreateDateColumn()
  plr_created_at: Date;

  @OneToMany(() => PlayerGameStats, stats => stats.player)
  playerGameStats: PlayerGameStats[];

  @OneToMany(() => ScoringEvent, event => event.player)
  scoringEvents: ScoringEvent[];
}