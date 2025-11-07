import { ApiProperty } from "@nestjs/swagger";
import { ApiEntity } from "src/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "src/common/global-entity/base-entity.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Card } from "./card.entity";

@Entity()
@ApiEntity()
export class HistoryPayment extends BaseEntity {
  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;

  @ManyToOne(() => Card, (card) => card.historySend)
  @JoinColumn()
  @ApiProperty({ type: () => Card })
  cardSend: Card;

  @ManyToOne(() => Card, (card) => card.historyReceive)
  @JoinColumn()
  @ApiProperty({ type: () => Card })
  cardReceive: Card;
}
