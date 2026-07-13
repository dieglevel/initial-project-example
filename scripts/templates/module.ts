export const generateModule = (moduleName: string, className: string) =>
  `import { Module } from "@nestjs/common";
import { ${className}Service } from "./${moduleName}.service";
import { ${className}Controller } from "./${moduleName}.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ${className}Entity } from "./_entities/${moduleName}.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([${className}Entity]),
  ],
  controllers: [${className}Controller],
  providers: [${className}Service],
  exports: [${className}Service],
})
export class ${className}Module {}
`;
