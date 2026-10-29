import { BasePaginatedDto } from "@/common/dto/swagger-schema/base-paginated.dto";
import type { FeedbackEntity } from "../_entities/feedback.entity";

export class Feedback_Paging_Response extends BasePaginatedDto {
  items: FeedbackEntity[];
}
