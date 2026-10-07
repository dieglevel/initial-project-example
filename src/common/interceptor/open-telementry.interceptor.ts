import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { Observable } from "rxjs";
import { catchError, finalize } from "rxjs/operators";

@Injectable()
export class OpenTelemetryInterceptor implements NestInterceptor {
  private readonly tracer = trace.getTracer("nestjs-app");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const controller = context.getClass().name;
    const handler = context.getHandler().name;

    const span = this.tracer.startSpan(`${controller}.${handler}`);

    span.setAttributes({
      "nestjs.controller": controller,
      "nestjs.handler": handler,
    });

    return next.handle().pipe(
      catchError((error: unknown) => {
        const exception =
          error instanceof Error ? error : new Error(String(error));

        span.recordException(exception);

        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: exception.message,
        });

        throw error;
      }),
      finalize(() => {
        span.end();
      }),
    );
  }
}
