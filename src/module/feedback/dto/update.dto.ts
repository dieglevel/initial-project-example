import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import {
  FEEDBACK_FEATURE,
  FEEDBACK_STATUS,
  FEEDBACK_TYPE,
} from "../feedback.enum";
import { FeedbackEntity } from "../_entities/feedback.entity";

export class Feedback_Update_Request {
  @ApiPropertyOptional({ description: "Feedback title" })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: "Detailed feedback content" })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ enum: FEEDBACK_FEATURE })
  @IsEnum(FEEDBACK_FEATURE)
  @IsOptional()
  feature?: FEEDBACK_FEATURE;

  @ApiPropertyOptional({ enum: FEEDBACK_TYPE })
  @IsEnum(FEEDBACK_TYPE)
  @IsOptional()
  type?: FEEDBACK_TYPE;

  @ApiPropertyOptional({ enum: FEEDBACK_STATUS })
  @IsEnum(FEEDBACK_STATUS)
  @IsOptional()
  status?: FEEDBACK_STATUS;
}

export class Feedback_Update_Response extends FeedbackEntity {}
