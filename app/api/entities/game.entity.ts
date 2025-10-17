import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Season } from './season.entity';
import { Team } from './team.entity';
import { PlayerGameStats } from './player-game-stats.entity';
import { TeamGameStats } from './team-game-stats.entity';
import { ScoringEvent } from './scoring-event.entity';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn()
  gm_id: number;

  @Column({ type: 'int', unique: true })
  gm_code: number;

  @Column()
  gm_fk_ssn_id: number;

  @Column()
  gm_fk_home_tm_id: number;

  @Column()
  gm_fk_away_tm_id: number;

  @Column({ type: 'timestamp', nullable: true })
  gm_date: Date;

  @Column({ type: 'int', nullable: true })
  gm_home_score: number;

  @Column({ type: 'int', nullable: true })
  gm_away_score: number;

  @Column({ type: 'varchar', length: 20, default: 'Scheduled' })
  gm_status: string;

  @CreateDateColumn()
  gm_created_at: Date;

  @ManyToOne(() => Season, season => season.games)
  @JoinColumn({ name: 'gm_fk_ssn_id' })
  season: Season;

  @ManyToOne(() => Team, team => team.homeGames)
  @JoinColumn({ name: 'gm_fk_home_tm_id' })
  homeTeam: Team;

  @ManyToOne(() => Team, team => team.awayGames)
  @JoinColumn({ name: 'gm_fk_away_tm_id' })
  awayTeam: Team;

  @OneToMany(() => PlayerGameStats, stats => stats.game)
  playerGameStats: PlayerGameStats[];

  @OneToMany(() => TeamGameStats, stats => stats.game)
  teamGameStats: TeamGameStats[];

  @OneToMany(() => ScoringEvent, event => event.game)
  scoringEvents: ScoringEvent[];
}