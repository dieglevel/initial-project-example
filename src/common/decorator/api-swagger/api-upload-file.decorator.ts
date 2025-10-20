import { applyDecorators } from "@nestjs/common";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";

/**
 * Decorator Swagger cho upload 1 file.
 * @param fieldName tên field file trong form-data (thường là 'file')
 */
export function ApiUploadFile(fieldName: string = "file") {
  return applyDecorators(
    ApiConsumes("multipart/form-data"),
    ApiBody({
      schema: {
        type: "object",
        properties: {
          [fieldName]: {
            type: "string",
            format: "binary",
          },
        },
      },
    }),
  );
}
