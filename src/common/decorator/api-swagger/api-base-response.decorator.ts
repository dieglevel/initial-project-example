import { applyDecorators, Type } from "@nestjs/common";
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

  const decorators = [ApiExtraModels(BaseResponseDto, model)];

  if (isPaginated) {
    decorators.push(ApiExtraModels(PaginatedResponseDto));
  }

  return applyDecorators(
    ...decorators,
    ApiOkResponse({
      description: "Successful response",
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponseDto) },
          {
            properties: {
              data: isPaginated
                ? {
                    allOf: [
                      { $ref: getSchemaPath(PaginatedResponseDto) },
                      {
                        properties: {
                          items: {
                            type: "array",
                            items: { $ref: getSchemaPath(model) },
                          },
                        },
                      },
                    ],
                  }
                : isArray
                  ? {
                      type: "array",
                      items: { $ref: getSchemaPath(model) },
                    }
                  : { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
}
