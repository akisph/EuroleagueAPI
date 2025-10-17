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