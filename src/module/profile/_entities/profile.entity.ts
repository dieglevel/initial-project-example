import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { AccountEntity } from "../../account/_entities/account.entity";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FileEntity } from "@/module/static-file/_entities/file.entity";
import { IsNumber, IsOptional } from "class-validator";
import {
  SETTING_DARK_MODE,
  SETTING_LANGUAGE,
  SETTING_THEME,
} from "../profile.enum";

@Entity({ name: "profile" })
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

  @Column({
    nullable: false,
    default: SETTING_DARK_MODE.LIGHT,
    enum: SETTING_DARK_MODE,
    type: "enum",
  })
  @ApiPropertyOptional({ enum: SETTING_DARK_MODE })
  darkMode: SETTING_DARK_MODE;

  @Column({
    nullable: false,
    default: SETTING_THEME.HUTAO,
    enum: SETTING_THEME,
    type: "enum",
  })
  @ApiPropertyOptional({ enum: SETTING_THEME })
  theme: SETTING_THEME;

  @Column({
    nullable: false,
    default: SETTING_LANGUAGE.EN,
    enum: SETTING_LANGUAGE,
    type: "enum",
  })
  @ApiPropertyOptional({ enum: SETTING_LANGUAGE })
  language: SETTING_LANGUAGE;

  @OneToOne(() => AccountEntity, (account) => account.profile, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "accountId" })
  @ApiProperty({ type: () => AccountEntity, default: "Account" })
  account: AccountEntity;
}
