// filters/ws-exception.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, Logger } from "@nestjs/common";
import { WsException, BaseWsExceptionFilter } from "@nestjs/websockets";
import { Socket } from "socket.io";

interface WsErrorPayload {
  message?: string;
  [key: string]: unknown;
}

function isWsErrorPayload(value: unknown): value is WsErrorPayload {
  return typeof value === "object" && value !== null;
}

function extractMessage(error: string | object): string {
  if (typeof error === "string") {
    return error;
  }

  if (isWsErrorPayload(error) && typeof error.message === "string") {
    return error.message;
  }

  return "Unknown error";
}

@Catch(WsException)
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: WsException, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();
    const error = exception.getError();

    this.logger.error(`WebSocket exception for client ${client.id}:`, error);

    client.emit("exception", {
      status: "error",
      message: extractMessage(error),
    });
  }
}
