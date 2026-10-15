import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { AccountEntity } from "../../account/_entities/account.entity";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FileEntity } from "@/module/static-file/_entities/file.entity";
import { IsNumber, IsOptional } from "class-validator";

@Entity()
@ApiEntity()
export class ProfileEntity extends BaseEntity {
  @Column({ nullable: true })
  @ApiPropertyOptional()
  firstName: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  lastName: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  dateOfBirth: Date;

  @ApiProperty({ type: () => FileEntity, default: "File" })
  @OneToOne(() => FileEntity, { nullable: true, eager: true })
  @JoinColumn({ name: "avatarId" })
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  avatar: FileEntity | null;

  @OneToOne(() => AccountEntity, (account) => account.profile, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "accountId" })
  @ApiProperty({ type: () => AccountEntity, default: "Account" })
  account: AccountEntity;
}
