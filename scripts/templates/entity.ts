export const generateEntity = (
  moduleName: string,
  className: string,
): string => `import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Entity } from "typeorm";

@Entity("${moduleName}")
@ApiEntity()
export class ${className}Entity extends BaseEntity {}
`;
