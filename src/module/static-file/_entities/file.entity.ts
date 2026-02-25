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
import { FileProvider, FileType } from "../enum";

@ApiEntity()
@Entity("files")
@Index(["createdAt"])
export class FileEntity extends BaseEntity {
  @Column({ type: "enum", enum: FileType, default: FileType.OTHER })
  fileType: FileType;

  @Column({ type: "varchar" })
  fullPath: string;

  @Column({ type: "bigint" })
  size: number;

  @Column({ type: "varchar" })
  fileSave: string;

  @Column({ type: "varchar" })
  fileOriginal: string;

  @Column({ type: "varchar" })
  mimeType: string;

  @Column({ type: "int", nullable: true, default: null })
  order: number;

  @Column({ type: "varchar", nullable: true, default: null })
  relativeId: string;

  @Column({
    type: "enum",
    enum: FileProvider,
    nullable: false,
    default: FileProvider.LOCAL_DISK,
  })
  provider: FileProvider;
}
