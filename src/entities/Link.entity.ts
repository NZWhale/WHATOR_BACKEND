import { ManyToOne, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './User.entity';

@Entity()
export class LinkEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ length: 2048 })
  link: string;

  @Column({ name: 'link_type' })
  linkType: string;

  @Column({ name: 'receive_date' })
  receiveDate: Date;

  @ManyToOne(() => UserEntity, (user) => user.links)
  user: UserEntity;
}
