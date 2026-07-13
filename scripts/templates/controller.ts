export const generateController = (
  moduleName: string,
  className: string,
  serviceName: string,
): string =>
  `
import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { ${className}Service } from "./${moduleName}.service";

@Controller("${moduleName}")
@ApiBearerAuth("access-token")
export class ${className}Controller {
  constructor(private readonly ${serviceName}Service: ${className}Service) {}

}
`.trimStart();
