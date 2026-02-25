import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  BaseEntity as TypeORMBaseEntity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { ApiEntity } from "../decorator/api-swagger/api-entity-property.decorator";

@ApiEntity()
export abstract class BaseEntity {
  @PrimaryGeneratedColumn("identity")
  id: string;

  @CreateDateColumn({ select: false })
  @ApiProperty({ writeOnly: true })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  @ApiProperty({ writeOnly: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true, select: false })
  @ApiPropertyOptional({ writeOnly: true })
  deletedAt?: Date;
}
