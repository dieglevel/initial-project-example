/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Delete, Get, HttpCode, Param, Post, Type } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "../decorator/api-swagger/api-base-response.decorator";
import { ApiPagination } from "../decorator/pagination/api-pagination.decorator";
import { CurrentUser } from "@/module/auth/decorator/current-user.decorator";
import type { JwtPayload } from "@/module/auth/payload.type";
import type { PaginationQuery } from "../dto/interface/pagination.interface";
import { Pagination } from "../decorator/pagination/pagination.decorator";

export interface GenericControllerOptions {
  entity: any;
  dto: {
    create: any;
    update: any;
  };
  responses: {
    getAll: any;
    create: any;
    paging: any;
    update: any;
    delete: any;
  };
  excludeSearch?: string[];
}

export function CreateGenericController(
  options: GenericControllerOptions,
): any {
  const { entity, dto, responses, excludeSearch } = options;

  @ApiBearerAuth("access-token")
  class BaseController {
    // Inject BaseCrudService thông qua lớp con
    constructor(protected readonly service: any) {}

    @Get("/all")
    @HttpCode(200)
    @ApiBaseResponse(responses.getAll)
    async getAll(@CurrentUser() userId: JwtPayload) {
      // Pass userId vào find options (TypeORM format) để đảm bảo user chỉ lấy đúng data của mình
      return this.service.findAll({ where: { userId: userId.sub } });
    }

    @Post("/create")
    @HttpCode(200)
    @ApiBaseResponse(responses.create)
    async create(@CurrentUser() userId: JwtPayload, @Body() body: any) {
      // Trộn userId.sub vào body trước khi lưu nếu hệ thống của bạn yêu cầu gắn Todo với User
      return this.service.create({ ...body, userId: userId.sub });
    }

    @Get("paging")
    @HttpCode(200)
    @ApiBaseResponse(responses.paging)
    @ApiPagination(entity, { excludeSearch, excludeOrder: [] })
    async getPaging(@Pagination() pagination: PaginationQuery<any>) {
      return this.service.paging(pagination);
    }

    @Post("/update/:id")
    @HttpCode(200)
    @ApiBaseResponse(responses.update)
    async update(@Param("id") id: string, @Body() body: any) {
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
