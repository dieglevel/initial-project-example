import { BasePaginatedDto } from "src/common/dto/swagger-schema/base-paginated.dto";
import { Todo } from "../_entities/todo.entity";

export class PagingTodoDto {}

export class PagingTodoResponseDto extends BasePaginatedDto {
  items: Todo[];
}
