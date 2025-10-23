import { ApiEntity } from "src/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "src/common/global-entity/base-entity.entity";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Account } from "../../account/_entities/account.entity";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

@Entity()
@ApiEntity()
export class Profile extends BaseEntity {
  @Column({ nullable: true })
  @ApiPropertyOptional()
  firstName: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  lastName: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  dateOfBirth: Date;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  avatar: string;

  @OneToOne(() => Account, (account) => account.profile, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "accountId" })
  @ApiProperty({ type: () => Account, default: "Account" })
  account: Account;
}
