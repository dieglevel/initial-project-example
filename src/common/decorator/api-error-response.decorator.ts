import { applyDecorators } from "@nestjs/common";
import { ApiResponse, ApiExtraModels, getSchemaPath } from "@nestjs/swagger";
import {
  BadRequestResponseDto,
  ErrorResponseDto,
} from "../dto/class/error-response.dto";

interface ErrorResponseOption {
  status: number;
  description: string;
  type: new (...args: any[]) => any;
}

export function ApiErrorResponses(
  responses: ErrorResponseOption[] = [],
): ReturnType<typeof applyDecorators> {
  const defaultErrors: ErrorResponseOption[] = [
    {
      status: 400,
      description: "Bad Request",
      type: BadRequestResponseDto,
    },
    {
      status: 500,
      description: "Internal Server Error",
      type: ErrorResponseDto,
    },
  ];

  const allResponses = [...responses, ...defaultErrors];

  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiExtraModels(BadRequestResponseDto),
    ...allResponses.map((res) =>
      ApiResponse({
        status: res.status,
        description: res.description,
        schema: { $ref: getSchemaPath(res.type) },
      }),
    ),
  );
}
