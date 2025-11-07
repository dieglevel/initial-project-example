import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ApiEntity } from "src/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "src/common/global-entity/base-entity.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { HistoryPayment } from "./history-payment.entity";
import { Account } from "src/module/account/_entities/account.entity";

@Entity()
@ApiEntity()
export class Card extends BaseEntity {
  @Column({
    type: "decimal",
    default: 0,
    precision: 15,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;

  @OneToMany(
    () => HistoryPayment,
    (historyPayment) => historyPayment.cardSend,
    {
      cascade: true,
      onDelete: "CASCADE",
    },
  )
  @ApiPropertyOptional({ type: () => HistoryPayment })
  historySend: HistoryPayment[];

  @OneToMany(
    () => HistoryPayment,
    (historyPayment) => historyPayment.cardReceive,
    {
      cascade: true,
      onDelete: "CASCADE",
    },
  )
  @ApiProperty({ type: () => HistoryPayment })
  historyReceive: HistoryPayment[];

  @OneToOne(() => Account, (account) => account.card, {
    cascade: true,
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn()
  @ApiPropertyOptional({ type: () => Account })
  account: Account;
}
