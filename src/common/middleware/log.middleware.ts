import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as process from "node:process";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger("Logger");

  use(req: Request, res: Response, next: NextFunction): void {
    const { ip, method, originalUrl, headers } = req;
    const userAgent = headers["user-agent"] || "";
    const authHeader = headers["authorization"];
    const start = process.hrtime();

    // this.logger.debug(`🔐 Authorization Header: ${authHeader || "None"}`);

    res.on("finish", () => {
      const { statusCode } = res;
      const contentLength = res.get("content-length");
      const responseTime = process.hrtime(start);
      const elapsedTimeInMilliseconds =
        responseTime[0] * 1000 + responseTime[1] / 1e6;

      this.logger.log(
        `${method} ${originalUrl} [${statusCode}] - ${elapsedTimeInMilliseconds.toFixed(2)} ms`,
      );
    });

    res.on("error", (err) => {
      this.logger.error(
        `Error: ${err} ${method} ${originalUrl} ${userAgent} ${ip}`,
      );
    });

    next();
  }
}
