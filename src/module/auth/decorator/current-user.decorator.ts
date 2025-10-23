import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "../payload.type";

export const CurrentUser = createParamDecorator(
  (data: JwtPayload, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest<{
      user: JwtPayload;
    }>().user;
  },
);
