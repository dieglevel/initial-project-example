import { OmitType } from "@nestjs/swagger";
import { FeedbackEntity } from "../_entities/feedback.entity";

export class Feedback_GetAll_Response extends OmitType(FeedbackEntity, []) {}
