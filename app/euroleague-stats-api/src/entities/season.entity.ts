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