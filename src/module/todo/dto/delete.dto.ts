import { Todo } from "../_entities/todo.entity";

export class DeleteTodoDto {}

export class DeleteTodoResponseDto {
  message: string;
  isDeleted: boolean;
}
