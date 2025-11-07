import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ApiEntity } from "src/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "src/common/global-entity/base-entity.entity";
import { Column, Entity, OneToMany, OneToOne } from "typeorm";
import { Profile } from "../../profile/_entities/profile.entity";
import { Todo } from "src/module/todo/_entities/todo.entity";
import { Card } from "src/module/payment/_entities/card.entity";

@Entity()
@ApiEntity()
export class Account extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  @ApiProperty({ writeOnly: true })
  password: string;

  @Column({ default: false })
  @ApiPropertyOptional()
  isVerified: boolean;

  @OneToOne(() => Profile, (profile) => profile.account, {
    cascade: true,
    onDelete: "CASCADE",
    eager: true,
  })
  @ApiPropertyOptional({ type: () => Profile, default: "Profile" })
  profile?: Profile;

  @OneToMany(() => Todo, (todo) => todo.account)
  @ApiPropertyOptional({ type: () => Todo, isArray: true, default: "Todo" })
  todos: Todo[];

  @OneToOne(() => Card, (card) => card.account, {
    nullable: false,
  })
  @ApiPropertyOptional({ type: () => Card, default: "Card" })
  card: Card;
}
