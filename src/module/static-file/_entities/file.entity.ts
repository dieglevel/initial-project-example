import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { ApiEntity } from "src/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "src/common/global-entity/base-entity.entity";

@ApiEntity()
@Entity("files")
@Index(["filename"])
export class FileEntity extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  filename: string;

  @Column({ type: "varchar", length: 100 })
  mimeType: string;

  @Column({ type: "bigint" })
  size: number;

  @Column({ type: "varchar", length: 500 })
  path: string;

  @Column({ type: "varchar", length: 1000, nullable: true })
  url?: string;

  @Column({ type: "boolean", default: false })
  isPublic: boolean;
}
