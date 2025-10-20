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

    return new BadRequestException({
      message: "Validation failed",
      errors: formattedErrors,
    });
  },
});
