import { AuthService } from "@/module/auth/auth.service";
import { IS_PUBLIC_KEY } from "@/module/auth/decorator/public.decorator";
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(AuthService)
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromSocket(client);
    console.log(`Extracted token from client ${client.id}:`, token);

    if (!token) {
      throw new WsException("Unauthorized: Token missing");
    }

    try {
      const payload = await this.authService.validateUser(token);
      console.log(
        `WebSocket client ${client.id} authenticated with payload:`,
        payload,
      );

      // Define a typed interface or record for client.data
      const clientData = (client.data ?? {}) as Record<string, unknown>;
      clientData.user = payload;
      client.data = clientData;

      return true;
    } catch {
      throw new WsException("Unauthorized: Invalid token");
    }
  }

  private extractTokenFromSocket(client: Socket): string | undefined {
    // Cast unsafe 'any' properties to typed records/strings
    const auth = client.handshake.auth as Record<string, unknown> | undefined;
    const headers = client.handshake.headers as
      | Record<string, string | undefined>
      | undefined;

    const authObjectToken =
      typeof auth?.token === "string" ? auth.token : undefined;
    const headerToken = headers?.authorization;

    const rawToken = authObjectToken || headerToken;
    if (!rawToken) {
      return undefined;
    }

    return this.extractBearerToken(rawToken);
  }

  private extractBearerToken(authorization: string): string | undefined {
    const [type, token] = authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : authorization;
  }
}
