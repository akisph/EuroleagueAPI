// Table: seasons
// Purpose: Stores season metadata (code, name) used to group games. A season
// has many games. Useful for filtering and historical queries by season.
// Relationships:
//  - Game (One season -> many games)
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Game } from './game.entity';

@Entity('seasons')
export class Season {
  @PrimaryGeneratedColumn()
  ssn_id: number;

  @Column({ type: 'varchar', length: 10, unique: true })
  ssn_code: string;

  @Column({ type: 'varchar', length: 50 })
  ssn_name: string;


  @CreateDateColumn()
  ssn_created_at: Date;

  @OneToMany(() => Game, game => game.season)
  games: Game[];
}