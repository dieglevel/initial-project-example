import { BadRequestException, ValidationPipe } from "@nestjs/common";

export const ValidatePipeConfig = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors) => {
    const formattedErrors = errors.map((err) => ({
      field: err.property,
      messages: Object.values(err.constraints || {}),
    }));

    console.log("Validation errors:", errors);

    return new BadRequestException({
      message: "Validation failed",
      errors: formattedErrors,
    });
  },
});
