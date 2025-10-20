import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { PaginationQueryDto } from "src/common/dto/swagger-schema/pagination/pagination.dto";

export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PaginationQueryDto => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ query: PaginationQueryDto }>();
    const query = request.query;

    // Chuyển query sang đúng kiểu Dto
    const dto = plainToInstance(PaginationQueryDto, query, {
      enableImplicitConversion: true,
    });

    // Validate thủ công
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }

    return dto;
  },
);
