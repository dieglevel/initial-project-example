import { applyDecorators, Type } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { BaseResponseDto } from "src/common/dto/swagger-schema/base-response.dto";

interface ApiBaseResponseOptions {
  isArray?: boolean;
  isPaginated?: boolean;
}

/**
 * @description Tạo response schema chuẩn Swagger
 * - Mặc định: Trả về 1 object
 * - isArray: Trả về mảng các object
 */
export function ApiBaseResponse<T extends Type<any>>(
  model: T,
  options: ApiBaseResponseOptions = {},
) {
  const { isArray = false, isPaginated = false } = options;

  const decorators = [ApiExtraModels(model, BaseResponseDto)];

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
          data: isArray
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
