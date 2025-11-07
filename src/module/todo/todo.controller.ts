import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "src/common/decorator/api-swagger/api-base-response.decorator";
import { TodoService } from "./todo.service";
import { CurrentUser } from "../auth/decorator/current-user.decorator";
import { JwtPayload } from "../auth/payload.type";
import { GetAllTodoResponseDto } from "./dto/get-all.dto";
import { CreateTodoDto, CreateTodoResponseDto } from "./dto/create.dto";
import { UpdateTodoDto, UpdateTodoResponseDto } from "./dto/update.dto";
import { DeleteTodoResponseDto } from "./dto/delete.dto";
import { Todo } from "./_entities/todo.entity";
import { ApiPagination } from "src/common/decorator/pagination/api-pagination.decorator";
import { PagingTodoResponseDto } from "./dto/paging.dto";
import { PaginationQuery } from "src/common/dto/interface/pagination.dto";
import { Pagination } from "src/common/decorator/pagination/pagination.decorator";

@Controller("todo")
@ApiBearerAuth("access-token")
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get("/all")
  @HttpCode(200)
  @ApiBaseResponse(GetAllTodoResponseDto)
  async getAll(@CurrentUser() userId: JwtPayload) {
    return this.todoService.getAllTodos(userId.sub);
  }

  @Post("/create")
  @HttpCode(200)
  @ApiBaseResponse(CreateTodoResponseDto)
  async create(@CurrentUser() userId: JwtPayload, @Body() body: CreateTodoDto) {
    return this.todoService.createTodo(userId.sub, body);
  }

  @Get("paging")
  @HttpCode(200)
  @ApiBaseResponse(PagingTodoResponseDto)
  @ApiPagination(Todo, { exclude: ["isCompleted"] })
  async getPaging(@Pagination() pagination: PaginationQuery<Todo>) {
    return this.todoService.pagingTodo(pagination);
  }

  @Post("/update/:id")
  @HttpCode(200)
  @ApiBaseResponse(UpdateTodoResponseDto)
  async update(@Param("id") id: string, @Body() body: UpdateTodoDto) {
    return this.todoService.updateTodo(id, body);
  }

  @Delete("/delete/:id")
  @HttpCode(200)
  @ApiBaseResponse(DeleteTodoResponseDto)
  async delete(@Param("id") id: string) {
    return this.todoService.deleteTodo(id);
  }
}
