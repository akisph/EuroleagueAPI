// Table: users
// Purpose: Stores application users for authentication/authorization. Contains
// username, email, password hash, role and active flag. This table is
// independent of the sporting domain model and used for API access control.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  usr_id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  usr_username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  usr_email: string;

  @Column({ type: 'varchar', length: 255 })
  usr_password_hash: string;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  usr_role: string;

  @CreateDateColumn()
  usr_created_at: Date;

  @Column({ type: 'boolean', default: true })
  usr_is_active: boolean;
}