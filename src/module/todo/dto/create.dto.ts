import { IsBoolean, IsNotEmpty, IsString } from "class-validator";
import { Todo } from "../_entities/todo.entity";

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @IsBoolean()
  isCompleted: boolean;
}

export class CreateTodoResponseDto extends Todo {}
