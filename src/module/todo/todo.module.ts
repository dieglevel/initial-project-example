import { Module } from "@nestjs/common";
import { TodoService } from "./todo.service";
import { TodoController } from "./todo.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Todo } from "./_entities/todo.entity";
import { Account } from "../account/_entities/account.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Todo, Account])],
  controllers: [TodoController],
  providers: [TodoService],
})
export class TodoModule {}
