import { IsBoolean, IsNotEmpty, IsString } from "class-validator";
import { Todo } from "../_entities/todo.entity";

export class UpdateTodoDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @IsBoolean()
  isCompleted: boolean;
}

export class UpdateTodoResponseDto extends Todo {}
