import { applyDecorators } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";

export function ApiPagination({
  sortFields = [],
}: { sortFields?: string[] } = {}) {
  const decorators = [
    ApiQuery({ name: "page", required: false, type: Number, example: 1 }),
    ApiQuery({ name: "limit", required: false, type: Number, example: 10 }),
    ApiQuery({
      name: "sortBy",
      required: false,
      type: String,
      example: sortFields[0] ?? "createdAt",
      description: `Sắp xếp theo một trong các trường: ${sortFields.join(", ")}`,
      enum: sortFields.length ? sortFields : undefined,
    }),
    ApiQuery({
      name: "sortOrder",
      required: false,
      default: "ASC",
      enum: ["ASC", "DESC"],
      example: "ASC",
    }),
  ];

  return applyDecorators(...decorators);
}
