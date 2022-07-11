import { Column, ManyToOne, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './User.entity';

@Entity()
export class FileEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'path_to_file' })
  pathToFile: string;

  @Column({ name: 'receive_date' })
  receiveDate: Date;

  @ManyToOne(() => UserEntity, (user) => user.links)
  user: UserEntity;
}
