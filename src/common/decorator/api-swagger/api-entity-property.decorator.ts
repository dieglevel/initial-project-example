import { ApiProperty } from "@nestjs/swagger";
import { getMetadataArgsStorage } from "typeorm";

export function ApiEntity(): ClassDecorator {
  return (target: any) => {
    const columns = getMetadataArgsStorage().columns.filter(
      (col) => col.target === target,
    );

    for (const column of columns) {
      const propertyKey = column.propertyName;
      const existingDecorators =
        Reflect.getMetadata("swagger/apiModelPropertiesArray", target) || [];

      const alreadyDecorated = existingDecorators.some(
        (prop: any) => prop.propertyKey === propertyKey,
      );

      if (!alreadyDecorated) {
        ApiProperty()(target.prototype, propertyKey);
      }
    }
  };
}
