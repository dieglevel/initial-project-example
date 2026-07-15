/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Body, Delete, Get, HttpCode, Param, Post, Type } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "../decorator/api-swagger/api-base-response.decorator";
import { ApiPagination } from "../decorator/pagination/api-pagination.decorator";
import { CurrentUser } from "@/module/auth/decorator/current-user.decorator";
import type { JwtPayload } from "@/module/auth/payload.type";
import type { PaginationQuery } from "../dto/interface/pagination.interface";
import { Pagination } from "../decorator/pagination/pagination.decorator";

// 1. SỬA ĐỔI: Đổi kiểu dữ liệu của excludeSearch thành (keyof TEntity)[]
export interface GenericControllerOptions<
  TEntity extends object,
  TCreateDto,
  TUpdateDto,
> {
  entity: Type<TEntity>;
  dto: {
    create: Type<TCreateDto>;
    update: Type<TUpdateDto>;
  };
  responses: {
    getAll: any;
    create: any;
    paging: any;
    update: any;
    delete: any;
  };
  excludeSearch?: (keyof TEntity)[]; // Chỉ cho phép truyền các key thực tế của Entity
}

export interface IBaseCrudService<
  TEntity extends object,
  TCreateDto,
  TUpdateDto,
> {
  findAll(options: { where: Record<string, any> }): Promise<TEntity[]>;
  create(dto: TCreateDto & { account: { id: string } }): Promise<TEntity>;
  paging(pagination: PaginationQuery<TEntity>): Promise<any>;
  update(id: string, dto: TUpdateDto): Promise<TEntity>;
  delete(id: string): Promise<any>;
}

export function CreateGenericController<
  TEntity extends object,
  TCreateDto,
  TUpdateDto,
>(options: GenericControllerOptions<TEntity, TCreateDto, TUpdateDto>) {
  const { entity, dto, responses, excludeSearch } = options;

  @ApiBearerAuth("access-token")
  class BaseController {
    constructor(
      public readonly service: IBaseCrudService<
        TEntity,
        TCreateDto,
        TUpdateDto
      >,
    ) {}

    @Get("/all")
    @HttpCode(200)
    @ApiBaseResponse(responses.getAll)
    async getAll(@CurrentUser() userId: JwtPayload) {
      return this.service.findAll({ where: { account: { id: userId.sub } } });
    }

    @Post("/create")
    @HttpCode(200)
    @ApiBaseResponse(responses.create)
    async create(@CurrentUser() userId: JwtPayload, @Body() body: TCreateDto) {
      return this.service.create({ ...body, account: { id: userId.sub } });
    }

    @Get("paging")
    @HttpCode(200)
    @ApiBaseResponse(responses.paging)
    // TypeScript giờ đã thỏa mãn vì excludeSearch có kiểu trùng khớp hoàn toàn
    @ApiPagination(entity, { excludeSearch, excludeOrder: [] })
    async getPaging(@Pagination() pagination: PaginationQuery<TEntity>) {
      return this.service.paging(pagination);
    }

    @Post("/update/:id")
    @HttpCode(200)
    @ApiBaseResponse(responses.update)
    async update(@Param("id") id: string, @Body() body: TUpdateDto) {
      return this.service.update(id, body);
    }

    @Delete("/delete/:id")
    @HttpCode(200)
    @ApiBaseResponse(responses.delete)
    async delete(@Param("id") id: string) {
      return this.service.delete(id);
    }
  }

  return BaseController;
}
