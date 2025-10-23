import { applyDecorators, HttpCode, Type } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { BaseResponseDto } from "src/common/dto/swagger-schema/base-response.dto";
import { PaginatedResponseDto } from "src/common/dto/swagger-schema/pagination/pagination-response.dto";

interface ApiBaseResponseOptions {
  isArray?: boolean;
  isPaginated?: boolean;
}

export function ApiBaseResponse<T extends Type<any>>(
  model: T,
  options: ApiBaseResponseOptions = {},
) {
  const { isArray = false, isPaginated = false } = options;

  const decorators = [ApiExtraModels(model, BaseResponseDto)];

  if (isPaginated) decorators.push(ApiExtraModels(PaginatedResponseDto));

  return applyDecorators(
    ...decorators,
    ApiOkResponse({
      description: "Successful response",
      schema: {
        type: "object",
        properties: {
          path: { type: "string", example: "/api/example" },
          timeStamp: { type: "string", example: "2025-10-20T12:00:00Z" },
          statusCode: { type: "number", example: 200 },
          data: isPaginated
            ? {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: { $ref: getSchemaPath(model) },
                  },
                  meta: {
                    type: "object",
                    properties: {
                      total: { type: "number" },
                      page: { type: "number" },
                      limit: { type: "number" },
                    },
                  },
                },
              }
            : isArray
              ? {
                  type: "array",
                  items: { $ref: getSchemaPath(model) },
                }
              : { $ref: getSchemaPath(model) },
        },
      },
    }),
  );
}
