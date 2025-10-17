// Table: scoring_events
// Purpose: Stores granular scoring events that happen during a game. Each
// event links to the game, the team that scored and the player (when
// available). Includes metadata like period, time remaining, points scored,
// shot type and zone. Useful for play-by-play and analytics.
// Relationships:
//  - Game (Many events belong to one Game)
//  - Team (Many events belong to one Team)
//  - Player (Many events belong to one Player)
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Game } from './game.entity';
import { Team } from './team.entity';
import { Player } from './player.entity';

@Entity('scoring_events')
export class ScoringEvent {
  @PrimaryGeneratedColumn()
  sc_id: number;

  @Column()
  sc_fk_gm_id: number;

  @Column()
  sc_fk_tm_id: number;

  @Column()
  sc_fk_plr_id: number;

  @Column({ type: 'int', nullable: true })
  sc_period: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  sc_time_remaining: string;

  @Column({ type: 'int', nullable: true })
  sc_points_scored: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sc_shot_type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sc_zone: string;

  @Column({ type: 'boolean', nullable: true })
  sc_is_made: boolean;

  @CreateDateColumn()
  sc_created_at: Date;

  @ManyToOne(() => Game, game => game.scoringEvents)
  @JoinColumn({ name: 'sc_fk_gm_id' })
  game: Game;

  @ManyToOne(() => Team, team => team.scoringEvents)
  @JoinColumn({ name: 'sc_fk_tm_id' })
  team: Team;

  @ManyToOne(() => Player, player => player.scoringEvents)
  @JoinColumn({ name: 'sc_fk_plr_id' })
  player: Player;
}