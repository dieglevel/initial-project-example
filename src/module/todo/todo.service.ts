import { DataSource, Equal, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PaginationQuery } from "src/common/dto/interface/pagination.interface";
import { alias, col } from "src/common/util/query-builder.util";

import { Account } from "../account/_entities/account.entity";
import { CreateTodoDto, CreateTodoResponseDto } from "./dto/create.dto";
import { DeleteTodoResponseDto } from "./dto/delete.dto";
import { GetAllTodoResponseDto } from "./dto/get-all.dto";
import { PagingTodoResponseDto } from "./dto/paging.dto";
import { Todo } from "./_entities/todo.entity";
import { UpdateTodoDto, UpdateTodoResponseDto } from "./dto/update.dto";

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,

    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    private readonly dataSource: DataSource,
  ) {}

  async getAllTodos(userId: string): Promise<GetAllTodoResponseDto> {
    const todos = await this.todoRepository.find({
      where: {
        account: {
          id: Equal(userId),
        },
      },
      relations: {
        account: true,
      },
    });
    return {
      todos,
    };
  }

  async createTodo(
    userId: string,
    data: CreateTodoDto,
  ): Promise<CreateTodoResponseDto> {
    const todo = this.todoRepository.create({
      description: data.description,
      isCompleted: data.isCompleted,
      account: { id: userId },
    });
    await this.todoRepository.save(todo);
    return todo;
  }

  async updateTodo(
    todoId: string,
    data: UpdateTodoDto,
  ): Promise<UpdateTodoResponseDto> {
    const todo = await this.todoRepository.findOneBy({ id: todoId });
    if (!todo) {
      throw new NotFoundException("Todo not found");
    }

    const updatedTodo = Object.assign(todo, data);
    await this.todoRepository.save(updatedTodo);
    return updatedTodo;
  }

  async deleteTodo(todoId: string): Promise<DeleteTodoResponseDto> {
    const result = await this.todoRepository.delete({ id: todoId });
    if (result.affected === 0) {
      throw new NotFoundException("Todo not found");
    }
    return {
      message: "Todo deleted successfully",
      isDeleted: true,
    };
  }

  async pagingTodo(
    pagination: PaginationQuery<Todo>,
  ): Promise<PagingTodoResponseDto> {
    const alias_account = alias<Account>("account");
    const alias_todo = alias<Todo>("todo");

    const searchQuery = pagination?.searchFields
      ?.map((field) => {
        return `todo.${field} LIKE '%${pagination.search}%'`;
      })
      .join(" OR ");

    console.log("🚀 ~ TodoService ~ pagingTodo ~ searchQuery:", searchQuery);

    const query = this.todoRepository
      .createQueryBuilder("todo")
      .leftJoin(alias_todo.account, "account");
    if (pagination.search && searchQuery) {
      query.andWhere(`(${searchQuery})`);
    }

    const result = await query.getMany();

    return {
      items: result,
      currentPage: pagination.page,
      itemsPerPage: pagination.pageSize,
      totalItems: await query.getCount(),
      totalPages: Math.ceil((await query.getCount()) / pagination.pageSize),
    };
  }
}
