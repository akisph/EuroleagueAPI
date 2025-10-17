// Table: player_game_stats
// Purpose: Stores per-player statistics for a single game. Each row represents
// a player's line for a particular game (minutes, points, rebounds, assists,
// etc.). It links to the `games`, `players` and `teams` tables.
// Relationships:
//  - Game (Many PlayerGameStats belong to one Game)
//  - Player (Many PlayerGameStats belong to one Player)
//  - Team (Many PlayerGameStats belong to one Team)
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Game } from './game.entity';
import { Player } from './player.entity';
import { Team } from './team.entity';

@Entity('player_game_stats')
export class PlayerGameStats {
  @PrimaryGeneratedColumn()
  pgs_id: number;

  @Column()
  pgs_fk_gm_id: number;

  @Column()
  pgs_fk_plr_id: number;

  @Column()
  pgs_fk_tm_id: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  pgs_minutes_played: string;

  @Column({ type: 'int', default: 0 })
  pgs_points: number;

  @Column({ type: 'int', default: 0 })
  pgs_field_goals_made: number;

  @Column({ type: 'int', default: 0 })
  pgs_field_goals_attempted: number;

  @Column({ type: 'int', default: 0 })
  pgs_three_pointers_made: number;

  @Column({ type: 'int', default: 0 })
  pgs_three_pointers_attempted: number;

  @Column({ type: 'int', default: 0 })
  pgs_free_throws_made: number;

  @Column({ type: 'int', default: 0 })
  pgs_free_throws_attempted: number;

  @Column({ type: 'int', default: 0 })
  pgs_total_rebounds: number;

  @Column({ type: 'int', default: 0 })
  pgs_assists: number;

  @Column({ type: 'int', default: 0 })
  pgs_steals: number;

  @Column({ type: 'int', default: 0 })
  pgs_blocks: number;

  @Column({ type: 'int', default: 0 })
  pgs_turnovers: number;

  @Column({ type: 'int', default: 0 })
  pgs_fouls: number;

  @ManyToOne(() => Game, game => game.playerGameStats)
  @JoinColumn({ name: 'pgs_fk_gm_id' })
  game: Game;

  @ManyToOne(() => Player, player => player.playerGameStats)
  @JoinColumn({ name: 'pgs_fk_plr_id' })
  player: Player;

  @ManyToOne(() => Team, team => team.playerGameStats)
  @JoinColumn({ name: 'pgs_fk_tm_id' })
  team: Team;
}