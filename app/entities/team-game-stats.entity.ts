import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Game } from './game.entity';
import { Team } from './team.entity';

@Entity('team_game_stats')
export class TeamGameStats {
  @PrimaryGeneratedColumn()
  tmgs_id: number;

  @Column()
  tmgs_fk_gm_id: number;

  @Column()
  tmgs_fk_tm_id: number;

  @Column({ type: 'boolean', nullable: true })
  tmgs_is_home: boolean;

  @Column({ type: 'int', default: 0 })
  tmgs_points: number;

  @Column({ type: 'int', default: 0 })
  tmgs_field_goals_made: number;

  @Column({ type: 'int', default: 0 })
  tmgs_field_goals_attempted: number;

  @Column({ type: 'int', default: 0 })
  tmgs_three_pointers_made: number;

  @Column({ type: 'int', default: 0 })
  tmgs_three_pointers_attempted: number;

  @Column({ type: 'int', default: 0 })
  tmgs_free_throws_made: number;

  @Column({ type: 'int', default: 0 })
  tmgs_free_throws_attempted: number;

  @Column({ type: 'int', default: 0 })
  tmgs_total_rebounds: number;

  @Column({ type: 'int', default: 0 })
  tmgs_assists: number;

  @Column({ type: 'int', default: 0 })
  tmgs_steals: number;

  @Column({ type: 'int', default: 0 })
  tmgs_blocks: number;

  @Column({ type: 'int', default: 0 })
  tmgs_turnovers: number;

  @Column({ type: 'int', default: 0 })
  tmgs_fouls: number;

  @ManyToOne(() => Game, game => game.teamGameStats)
  @JoinColumn({ name: 'tmgs_fk_gm_id' })
  game: Game;

  @ManyToOne(() => Team, team => team.teamGameStats)
  @JoinColumn({ name: 'tmgs_fk_tm_id' })
  team: Team;
}