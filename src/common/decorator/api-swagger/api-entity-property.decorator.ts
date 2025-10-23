/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { getMetadataArgsStorage } from "typeorm";

/**
 * Decorator tự động thêm ApiProperty cho tất cả các @Column() trong entity.
 */
export function ApiEntity(): ClassDecorator {
  return (target: Function) => {
    // Lấy toàn bộ metadata của các cột thuộc class này
    const columns = getMetadataArgsStorage().columns.filter(
      (col) => col.target === target,
    );

    for (const column of columns) {
      const propertyKey = column.propertyName;
      const isNullable = column.options?.nullable ?? false;

      // Lấy decorator phù hợp (Optional nếu nullable)
      const decorator = isNullable ? ApiPropertyOptional() : ApiProperty();

      // Kiểm tra xem property đã được swagger decorate chưa
      const hasSwaggerMetadata = Reflect.hasMetadata(
        "swagger/apiModelProperties",
        target.prototype,
        propertyKey,
      );

      if (!hasSwaggerMetadata) {
        decorator(target.prototype, propertyKey);
      }
    }
  };
}
