export const generateService = (moduleName: string, className: string) =>
  `import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ${className}Entity } from "./_entities/${moduleName}.entity";

@Injectable()
export class ${className}Service {
  constructor(
    @InjectRepository(${className}Entity)
    private readonly ${className}Repository: Repository<${className}Entity>,
  ) {}

}
`;
