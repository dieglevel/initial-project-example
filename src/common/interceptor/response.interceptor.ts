import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Response } from "../dto/interface/success-response.interface";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request & { url?: string }>();
    const response = ctx.getResponse<Response<T>>();
    const statusCode = response?.statusCode ?? 200;

    return next.handle().pipe(
      map((data: T) => ({
        path: request.url || "",
        timestamp: new Date(),
        statusCode,
        data,
      })),
    );
  }
}
