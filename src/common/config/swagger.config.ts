import { DocumentBuilder } from "@nestjs/swagger";

export const SwaggerBuilder = new DocumentBuilder()
  .setTitle("Author")
  .setDescription("API documentation for the Author application")
  .setExternalDoc("Swagger JSON", "/swagger/json")
  .setVersion("1.0")
  .addBearerAuth(
    {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      // name: "Authorization",
      // in: "header",
    },
    "access-token",
  )
  .build();
