export const generateService = (className: string) =>
  `import { Injectable } from "@nestjs/common";
import {  } from "./dto/request.dto";
import {  } from "./dto/response.dto";

@Injectable()
export class ${className}Service {
  constructor() {}

}
`;
