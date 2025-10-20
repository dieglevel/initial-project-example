export const generateRequestDto = (className: string) =>
  `
import { ApiProperty } from "@nestjs/swagger";


`.trimStart();
