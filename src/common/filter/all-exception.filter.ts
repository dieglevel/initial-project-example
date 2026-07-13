import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { QueryFailedError } from "typeorm";
import { ErrorResponse } from "../dto/interface/error-response.interface";

interface PostgresError {
  code?: string;
  detail?: string;
  column?: string;
  table?: string;
  constraint?: string;
  message: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exception");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let errors: any[] | undefined;

    // 🟩 NestJS HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody = exception.getResponse();

      if (typeof resBody === "string") {
        message = resBody;
      } else if (typeof resBody === "object" && resBody !== null) {
        const body = resBody as Record<string, any>;
        message = typeof body.message === "string" ? body.message : message;

        if (status === HttpStatus.BAD_REQUEST && Array.isArray(body.errors)) {
          errors = body.errors;
        }
      }
    }

    // 🟦 PostgreSQL QueryFailedError
    else if (exception instanceof QueryFailedError) {
      const pgError = exception as unknown as PostgresError;
      status = HttpStatus.CONFLICT;

      switch (pgError.code) {
        case "23505": {
          const field = pgError.detail?.match(/\((.*?)\)=/)?.[1] ?? "field";
          message = `${field} already exists`;
          break;
        }
        case "23503": {
          message = "Invalid reference or relation not found";
          status = HttpStatus.BAD_REQUEST;
          break;
        }
        case "23502": {
          const column = pgError.column ?? "field";
          message = `${column} cannot be null`;
          status = HttpStatus.BAD_REQUEST;
          break;
        }
        default: {
          message = pgError.detail || pgError.message || "Database error";
        }
      }
    }

    // 🟥 Normal Error
    else if (exception instanceof Error) {
      message = exception.message;
    }

    // 🟨 Fallback
    else {
      message = JSON.stringify(exception) || "Unknown error";
    }

    const errorResponse: ErrorResponse = {
      path: request.url,
      timeStamp: new Date(),
      statusCode: status,
      message,
    };

    // if (errors) errorResponse.errors = errors;

    if (status !== HttpStatus.UNAUTHORIZED) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `${request.method} ${request.url} → ${status} | ${JSON.stringify(
          message,
        )}`,
        stack,
      );
    }

    response.status(status).json(errorResponse);
  }
}
