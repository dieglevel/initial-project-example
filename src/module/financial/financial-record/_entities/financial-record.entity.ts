import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Column, Entity, Index } from "typeorm";
import { IsNumber, IsOptional, IsString } from "class-validator";

export interface RecordData {
  id_notification: string;
  title: string;
  ticker: string;
  notification: string;
  sub_text: string;
  app_package: string;
  channel: string;
}

@Entity("financial-record")
@ApiEntity()
export class FinancialRecordEntity extends BaseEntity {
  @Index({ unique: true, where: '"idNotification" IS NOT NULL' })
  @Column({ type: "varchar", length: 128, nullable: true })
  @IsString()
  @IsOptional()
  idNotification?: string | null;

  @Column({ type: "json", nullable: true })
  record: RecordData | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  @IsString()
  @IsOptional()
  appPackage?: string | null;

  @Column({ type: "varchar", length: 64, nullable: true })
  @IsString()
  @IsOptional()
  apiKey?: string | null;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value === null ? null : parseFloat(value),
    },
  })
  @IsNumber()
  @IsOptional()
  parsedAmount?: number | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  @IsString()
  @IsOptional()
  status?: string | null;

  @Column({ type: "int", nullable: true })
  @IsNumber()
  @IsOptional()
  walletId?: number | null;

  @Column({ type: "int", nullable: true })
  @IsNumber()
  @IsOptional()
  transactionId?: number | null;
}
