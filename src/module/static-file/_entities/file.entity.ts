import { ApiEntity } from "src/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "src/common/global-entity/base-entity.entity";
import { Profile } from "src/module/profile/_entities/profile.entity";
import { Column, Entity, Index, JoinColumn, OneToOne } from "typeorm";
import { FileProvider, FileType } from "../enum";
import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@ApiEntity()
@Entity("files")
@Index(["createdAt"])
@Index(["fileType"])
@Index(["provider"])
export class File extends BaseEntity {
  @ApiProperty({ enum: FileType, default: FileType.OTHER })
  @Exclude()
  @Column({ type: "enum", enum: FileType, default: FileType.OTHER })
  fileType: FileType;

  @ApiProperty({ enum: FileProvider, default: FileProvider.LOCAL_DISK })
  @Expose({ groups: ["fileProvider"] })
  @Column({
    type: "enum",
    enum: FileProvider,
    nullable: false,
    default: FileProvider.LOCAL_DISK,
  })
  provider: FileProvider;

  // Full path ex: <folder>/avatar/2024/09/01/abc123.jpg
  @Expose({ groups: ["fileProvider"] })
  @Column({ type: "varchar" })
  storagePath: string;

  @Expose({ groups: ["fileProvider"] })
  @Column({ type: "bigint" })
  size: number;

  @Expose({ groups: ["fileProvider"] })
  @Column({ type: "varchar" })
  fileKey: string;

  @Expose({ groups: ["fileProvider"] })
  @Column({ type: "varchar" })
  originalName: string;

  @Expose({ groups: ["fileProvider"] })
  @Column({ type: "varchar" })
  mimeType: string;

  @Expose({ groups: ["fileProvider"] })
  @Column({ type: "int", nullable: true, default: null })
  order: number;

  //Description
  @Expose({ groups: ["fileProvider"] })
  @Column({ nullable: true })
  metadata: string;

  // File tạm (upload xong nhưng chưa attach entity)
  @Expose({ groups: ["fileProvider"] })
  @Column({ default: true })
  isTemporary: boolean;

  @Expose()
  get url(): string {
    return `${process.env.APP_URL}/file/${this.storagePath}`;
  }
}
