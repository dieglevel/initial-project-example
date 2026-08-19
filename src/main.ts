import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";

import { ConfigService, ConfigType } from "@nestjs/config";
import { SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";
import { SwaggerBuilder } from "./common/config/swagger/swagger.config";
import {
  BadRequestResponseDto,
  ErrorResponseDto,
} from "./common/dto/swagger-schema/error-response.dto";
import { AllExceptionsFilter } from "./common/filter/all-exception.filter";
import { ResponseInterceptor } from "./common/interceptor/response.interceptor";
import { ValidatePipeConfig } from "./common/pipe/validation.pipe";
import { swaggerCss } from "./common/config/swagger/swagger.css";
import { appConfig } from "./common/environment/types/app.config";
import { ClassSerializerInterceptor } from "@nestjs/common";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          frameAncestors: [
            "'self'",
            "http://localhost:5173",
            "http://localhost:3002",
            "https://dieglevel.github.io",
          ],
        },
      },
    });
  });

  // app.use(
  //   express.text({
  //     type: ["text/plain", "application/json", "text/*"],
  //   }),
  // );

  app.enableCors({
    credentials: true,
    origin: ["https://dieglevel.github.io", "http://localhost:5173"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  });

  app.setGlobalPrefix(config.API_PREFIX);
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(ValidatePipeConfig);

  const document = SwaggerModule.createDocument(app, SwaggerBuilder, {
    extraModels: [ErrorResponseDto, BadRequestResponseDto],
  });

  SwaggerModule.setup("api", app, document, {
    jsonDocumentUrl: "swagger/json",
    customCss: swaggerCss,
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(config.PORT, config.HOST);
}
void bootstrap();
