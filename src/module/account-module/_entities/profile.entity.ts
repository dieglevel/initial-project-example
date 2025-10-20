import { ApiEntity } from "src/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "src/common/global-entity/base-entity.entity";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Account } from "./account.entity";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

@Entity()
@ApiEntity()
export class Profile extends BaseEntity {
  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  avatar: string;

  @OneToOne(() => Account, (account) => account.profile, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "accountId" })
  @ApiPropertyOptional({ type: () => Account })
  account?: Account;
}
