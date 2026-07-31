import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { AccountEntity } from "@/module/account/_entities/account.entity";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import {
  FINANCIAL_NOTIFICATION_LEVEL,
  FINANCIAL_NOTIFICATION_TYPE,
} from "../financial-notification.enum";

@Entity("financial-notification")
@ApiEntity()
export class FinancialNotificationEntity extends BaseEntity {
  @Column({ type: "varchar", length: 255, nullable: false })
  @IsString()
  title: string;

  @Column({ type: "text", nullable: false })
  @IsString()
  message: string;

  @Column({
    type: "enum",
    enum: FINANCIAL_NOTIFICATION_TYPE,
    nullable: false,
  })
  @IsEnum(FINANCIAL_NOTIFICATION_TYPE)
  type: FINANCIAL_NOTIFICATION_TYPE;

  @Column({
    type: "enum",
    enum: FINANCIAL_NOTIFICATION_LEVEL,
    nullable: false,
    default: FINANCIAL_NOTIFICATION_LEVEL.INFO,
  })
  @IsEnum(FINANCIAL_NOTIFICATION_LEVEL)
  level: FINANCIAL_NOTIFICATION_LEVEL;

  @Column({ type: "boolean", nullable: false, default: false })
  @IsBoolean()
  isRead: boolean;

  @Column({ type: "jsonb", nullable: true })
  @IsOptional()
  metadata?: Record<string, unknown> | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  @IsOptional()
  @IsString()
  dedupeKey?: string | null;

  @ManyToOne(() => AccountEntity, (account) => account.financialNotifications, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @ApiPropertyOptional({ type: () => AccountEntity, default: "Account" })
  account: AccountEntity;
}
