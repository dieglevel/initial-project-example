export const generateService = (className: string) =>
  `import { Injectable } from "@nestjs/common";

@Injectable()
export class ${className}Service {
  constructor() {}

}
`;
