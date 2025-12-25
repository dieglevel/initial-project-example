import { applyDecorators } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";
import { BaseEntityDto } from "src/common/dto/swagger-schema/base-entity.dto";

function getEntityFields<T extends object>(entity: new () => T): string[] {
  return Object.keys(new entity());
}

// Dùng để định  nghĩa cho Swagger về các tham số phân trang, sắp xếp, tìm kiếm
// exclude: danh sách các trường không muốn cho phép sắp xếp / tìm kiếm
export function ApiPagination<T extends object>(
  entity: new () => T,
  options?: {
    excludeSearch?: (keyof T)[];
    excludeOrder?: (keyof T)[];
  },
) {
  const allFields = getEntityFields(entity);
  const baseFields = getEntityFields(BaseEntityDto);

  // Chỉ lấy các field có thể sort / search
  const allowedSearchFields = allFields.filter(
    (f) =>
      !baseFields.includes(f) &&
      !options?.excludeSearch?.includes(f as keyof T),
  );

  const allowedOrderFields = allFields.filter(
    (f) =>
      !baseFields.includes(f) && !options?.excludeOrder?.includes(f as keyof T),
  );

  const decorators = [
    // --- Basic paging ---
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      example: 1,
      description: "Trang hiện tại (mặc định = 1)",
    }),
    ApiQuery({
      name: "pageSize",
      required: false,
      type: Number,
      example: 10,
      description: "Số item mỗi trang (mặc định = 10)",
    }),

    // --- Sort ---
    ApiQuery({
      name: "orderDirection",
      required: false,
      type: "object",
      isArray: true,
      description: `Sắp xếp theo 1 hoặc nhiều trường. Các trường được phép sắp xếp: ${allowedOrderFields.join(", ")}`,
      schema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: { type: "string", enum: allowedOrderFields },
            order: { type: "string", enum: ["ASC", "DESC"] },
          },
        },
      },
    }),

    // --- Search ---
    ApiQuery({
      name: "search",
      required: false,
      type: String,
      description: "Từ khóa tìm kiếm toàn cục",
    }),
    ApiQuery({
      name: "searchFields",
      required: false,
      isArray: true,
      type: String,
      enum: allowedSearchFields,
      description: `Các trường được phép search: ${allowedSearchFields.join(", ")}`,
    }),
  ];

  return applyDecorators(...decorators);
}
