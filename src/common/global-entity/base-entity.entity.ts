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
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn({})
  createdAt: Date;

  @UpdateDateColumn({})
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  @ApiPropertyOptional()
  deletedAt?: Date;
}
