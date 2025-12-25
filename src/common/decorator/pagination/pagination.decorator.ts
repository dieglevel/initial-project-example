/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// Decorator để trích xuất và chuyển đổi các tham số phân trang từ query string
// Sử dụng ở controller đóng vai trò là Search Query

import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from "@nestjs/common";
import { plainToInstance, Transform, Type } from "class-transformer";
import {
  IsOptional,
  IsPositive,
  Max,
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
} from "class-validator";

export const Pagination = createParamDecorator(
  <T>(data: unknown, ctx: ExecutionContext): PaginationQueryDto<T> => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ query: Record<string, any> }>();
    const rawQuery = request.query;

    // --- Parse sort from keys like sort[0][field], sort[0][order] ---
    const sort: any[] = [];
    const sortRegex = /^sort\[(\d+)\]\[(field|order)\]$/;

    for (const key in rawQuery) {
      const match = key.match(sortRegex);
      if (match) {
        const index = Number(match[1]);
        const prop = match[2];
        sort[index] = sort[index] || {};
        sort[index][prop] = rawQuery[key];
      }
    }

    // --- Parse searchFields from "searchFields[]" ---
    let searchFields: string[] = [];
    if (rawQuery["searchFields[]"]) {
      if (Array.isArray(rawQuery["searchFields[]"])) {
        searchFields = rawQuery["searchFields[]"];
      } else {
        searchFields = [rawQuery["searchFields[]"]];
      }
    } else if (typeof rawQuery.searchFields === "string") {
      searchFields = rawQuery.searchFields.split(",").map((s) => s.trim());
    }

    // --- Lọc bỏ các key flatten không cần thiết ---
    const cleanQuery = Object.fromEntries(
      Object.entries(rawQuery).filter(
        ([key]) =>
          !key.match(/^sort\[\d+\]\[.*\]$/) && key !== "searchFields[]",
      ),
    );

    // --- Gộp thành payload chuẩn ---
    const query: PaginationQueryDto<T> = {
      ...cleanQuery,
      orderDirection: sort,
      searchFields,
    } as PaginationQueryDto<T>;

    // --- Parse sang DTO ---
    const dto = plainToInstance(PaginationQueryDto, query, {
      enableImplicitConversion: true,
    }) as PaginationQueryDto<T>;

    return dto;
  },
);

// This is class to define pagination and sorting options in TypeScript.

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export class SortOption<T> {
  @IsString()
  field!: keyof T & string;

  @IsEnum(SortOrder)
  order: SortOrder = SortOrder.ASC;
}

export class PaginationQueryDto<T> {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(100)
  pageSize = 10;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortOption)
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) =>
          v instanceof SortOption ? { field: v.field, order: v.order } : v,
        )
      : [],
  )
  orderDirection: SortOption<T>[] = [];

  @IsOptional()
  @IsString()
  search = "";

  @IsOptional()
  @IsArray()
  @Transform(({ value }): (keyof T & string)[] =>
    typeof value === "string"
      ? (value.split(",") as (keyof T & string)[])
      : (value as (keyof T & string)[]),
  )
  searchFields: (keyof T & string)[] = [];

  get offset(): number {
    return (this.page - 1) * this.pageSize;
  }
}
