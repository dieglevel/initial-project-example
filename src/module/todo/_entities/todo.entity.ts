import { ApiEntity } from "src/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "src/common/global-entity/base-entity.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { Account } from "../../account/_entities/account.entity";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

@Entity()
@ApiEntity()
export class Todo extends BaseEntity {
  @Column({ type: "varchar" })
  description: string;

  @Column({ type: "boolean", default: false })
  isCompleted: boolean;

  @ManyToOne(() => Account, { cascade: true, onDelete: "CASCADE" })
  @JoinColumn()
  @ApiProperty({ type: () => Account })
  account: Account;
}
