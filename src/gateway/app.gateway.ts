import { OnApplicationBootstrap, UseFilters, UseGuards } from "@nestjs/common";
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { AuthGuard } from "@/module/auth/jwt.guard";
import { WsAuthGuard } from "./ws.guard";
import { WsExceptionFilter } from "./ws-exception.filter";

@WebSocketGateway(8000)
export class AppGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnApplicationBootstrap
{
  @WebSocketServer()
  server: Server;

  onApplicationBootstrap() {
    const url = `http://localhost:8000`;
    const green = "\x1b[32m";
    const reset = "\x1b[0m";
    console.log(
      "WebSocket Gateway is bootstrapped and ready to accept connections.",
      green + url + reset,
    );
  }

  afterInit(server: Server) {
    console.log("WebSocket Gateway Initialized");
  }

  handleConnection(client: Socket) {
    console.log(client.id);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsAuthGuard)
  @UseFilters(WsExceptionFilter)
  @SubscribeMessage("message")
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ): string {
    console.log(`Received from ${client.id}:`, payload);
    this.server.emit("events", payload);
    return "Message received";
  }
}
