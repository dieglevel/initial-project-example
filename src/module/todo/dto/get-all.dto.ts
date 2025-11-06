import { Todo } from "../_entities/todo.entity";

export class GetAllTodoDto {}

export class GetAllTodoResponseDto {
  todos: Todo[];
}
