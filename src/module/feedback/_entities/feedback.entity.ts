import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { AccountEntity } from "@/module/account/_entities/account.entity";
import { FileEntity } from "@/module/static-file/_entities/file.entity";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from "typeorm";
import {
  FEEDBACK_FEATURE,
  FEEDBACK_STATUS,
  FEEDBACK_TYPE,
} from "../feedback.enum";

@Entity("feedback")
@ApiEntity()
export class FeedbackEntity extends BaseEntity {
  @Column({ type: "varchar", length: 255, nullable: false })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Feedback title",
    example: "Lỗi hiển thị biểu đồ",
  })
  title: string;

  @Column({ type: "text", nullable: false })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Detailed feedback content",
    example: "Khi đổi tháng thì biểu đồ không cập nhật dữ liệu",
  })
  content: string;

  @Column({
    type: "enum",
    enum: FEEDBACK_FEATURE,
    nullable: false,
    default: FEEDBACK_FEATURE.OTHER,
  })
  @IsEnum(FEEDBACK_FEATURE)
  @ApiProperty({
    enum: FEEDBACK_FEATURE,
    description: "Target system feature / page",
    example: FEEDBACK_FEATURE.DASHBOARD,
  })
  feature: FEEDBACK_FEATURE;

  @Column({
    type: "enum",
    enum: FEEDBACK_TYPE,
    nullable: false,
    default: FEEDBACK_TYPE.BUG,
  })
  @IsEnum(FEEDBACK_TYPE)
  @ApiProperty({
    enum: FEEDBACK_TYPE,
    description: "Feedback category type",
    example: FEEDBACK_TYPE.BUG,
  })
  type: FEEDBACK_TYPE;

  @Column({
    type: "enum",
    enum: FEEDBACK_STATUS,
    nullable: false,
    default: FEEDBACK_STATUS.PENDING,
  })
  @IsEnum(FEEDBACK_STATUS)
  @ApiProperty({
    enum: FEEDBACK_STATUS,
    description: "Feedback resolution status",
    example: FEEDBACK_STATUS.PENDING,
  })
  status: FEEDBACK_STATUS;

  @Column({ type: "varchar", length: 255, nullable: true })
  @IsEmail()
  @IsOptional()
  @ApiPropertyOptional({
    description: "Contact email of the submitter",
    example: "user@example.com",
  })
  contactEmail?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: "Name of the submitter",
    example: "Nguyễn Văn A",
  })
  contactName?: string | null;

  @ManyToMany(() => FileEntity, { eager: true })
  @JoinTable({
    name: "feedback-files",
    joinColumn: { name: "feedbackId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "fileId", referencedColumnName: "id" },
  })
  @ApiPropertyOptional({
    type: () => [FileEntity],
    description: "Attached screenshot/image files (1-n)",
  })
  files?: FileEntity[];

  @ManyToOne(() => AccountEntity, {
    nullable: true,
    onDelete: "SET NULL",
    eager: true,
  })
  @JoinColumn({ name: "accountId" })
  @ApiPropertyOptional({
    type: () => AccountEntity,
    description: "Account submitting feedback if authenticated",
  })
  account?: AccountEntity | null;

  @Column({ type: "int", nullable: true })
  @IsOptional()
  @ApiPropertyOptional({ description: "Account ID if authenticated" })
  accountId?: number | null;
}
