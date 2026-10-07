import {
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  Header,
  Injectable,
  MessageEvent,
  NotFoundException,
  Res,
  Sse,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { fromEvent, map, Observable } from "rxjs";
import { spanBuffer, spanBus } from "./span-store";
import { Public } from "@/module/auth/decorator/public.decorator";

@Injectable()
class OtelGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const token = process.env.OTEL_DASHBOARD_TOKEN;
    if (!token) return process.env.NODE_ENV !== "production";
    const req = ctx.switchToHttp().getRequest();
    return req.query?.token === token || req.headers["x-otel-token"] === token;
  }
}

const CANDIDATES = [
  join(__dirname, "dashboard.html"),
  join(process.cwd(), "dist", "src", "telemetry", "dashboard.html"),
  join(process.cwd(), "dist", "telemetry", "dashboard.html"),
  join(process.cwd(), "src", "telemetry", "dashboard.html"),
];
let cached: string | undefined;
const loadHtml = () => {
  if (cached) return cached;
  const f = CANDIDATES.find(existsSync);
  if (!f) throw new NotFoundException("Không tìm thấy dashboard.html");
  return (cached = readFileSync(f, "utf8"));
};

@Public()
@UseGuards(OtelGuard)
@Controller("__otel")
export class OtelDashboardController {
  @Get()
  page(@Res() res: Response) {
    res.type("html").send(loadHtml());
  }

  @Get("spans")
  spans(@Res() res: Response) {
    res.json(spanBuffer);
  }

  @Sse("stream")
  @Header("Cache-Control", "no-cache")
  @Header("X-Accel-Buffering", "no") // nginx không gom đệm luồng SSE
  stream(): Observable<MessageEvent> {
    return fromEvent(spanBus, "span").pipe(
      map((data) => ({ data }) as MessageEvent),
    );
  }
}
