import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ErrorResponse } from "../dto/interface/error-response.interface";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const logger = new Logger("Exception");

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let errors: any[] | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === "string") {
        message = responseBody;
      } else if (responseBody && typeof responseBody === "object") {
        const resObj = responseBody as Record<string, any>;
        message = typeof resObj.message === "string" ? resObj.message : message;

        // 🟨 Nếu là lỗi 400 và có errors chi tiết
        if (status === HttpStatus.BAD_REQUEST && Array.isArray(resObj.errors)) {
          errors = resObj.errors;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    } else {
      message = String(exception);
    }

    const baseResponse: ErrorResponse = {
      path: request.url,
      timeStamp: new Date(),
      statusCode: status,
      message,
    };

    // 🟨 Nếu có errors (chỉ cho 400), trả kèm theo
    const responseBody = errors ? { ...baseResponse, errors } : baseResponse;

    if (status !== HttpStatus.UNAUTHORIZED) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      logger.error(
        `${request.method} ${request.url} → ${status} | ${JSON.stringify(message)}`,
        stack,
      );
    }

    response.status(status).json(responseBody);
  }
}
