import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import {
  FEEDBACK_FEATURE,
  FEEDBACK_STATUS,
  FEEDBACK_TYPE,
} from "../feedback.enum";
import { FeedbackEntity } from "../_entities/feedback.entity";

export class Feedback_Create_Request {
  @ApiProperty({
    description: "Feedback title",
    example: "Lỗi hiển thị biểu đồ",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: "Detailed feedback content",
    example: "Khi đổi tháng thì biểu đồ không cập nhật dữ liệu",
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    enum: FEEDBACK_FEATURE,
    description: "System feature or page relating to this feedback",
    example: FEEDBACK_FEATURE.DASHBOARD,
  })
  @IsEnum(FEEDBACK_FEATURE)
  @IsNotEmpty()
  feature: FEEDBACK_FEATURE;

  @ApiPropertyOptional({
    enum: FEEDBACK_TYPE,
    description: "Feedback type (bug, feature request, etc.)",
    default: FEEDBACK_TYPE.BUG,
  })
  @IsEnum(FEEDBACK_TYPE)
  @IsOptional()
  type?: FEEDBACK_TYPE;

  @ApiPropertyOptional({
    description: "Submitter contact email",
    example: "user@example.com",
  })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: "Submitter contact name",
    example: "Nguyễn Văn A",
  })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({
    type: [Number],
    description:
      "Array of FileEntity IDs (1-n images) uploaded via /static/upload",
    example: [1, 2],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  fileIds?: number[];
}

export class Feedback_Create_Response extends FeedbackEntity {}
