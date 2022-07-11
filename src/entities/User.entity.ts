import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { LinkEntity } from './Link.entity';
import { FileEntity } from './File.entity';

@Entity({ name: 'user' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({
    name: 'user_id',
    unique: true,
  })
  userId: number;

  @Column({
    name: 'user_name',
  })
  username: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'language_code' })
  languageCode: string;

  @Column({ name: 'is_bot' })
  isBot: boolean;

  @OneToMany((type) => LinkEntity, (link) => link.user)
  links: LinkEntity[];

  @OneToMany((type) => FileEntity, (file) => file.user)
  files: FileEntity[];
}
