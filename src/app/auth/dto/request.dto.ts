import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from "class-validator";

export class CreateAccount_RequestDto {
  @ApiProperty({ example: "user@example.com", required: true })
  @IsString({ message: "Email phải là một chuỗi" })
  @IsEmail(
    { host_whitelist: ["gmail.com", "yahoo.com", "outlook.com"] },
    { message: "Email không hợp lệ" },
  )
  @IsNotEmpty({ message: "Email không được để trống" })
  email: string;

  @ApiProperty({ example: "password123", required: true })
  @IsString({ message: "Mật khẩu phải là một chuỗi" })
  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  password: string;

  @ApiProperty({ example: "1234567890", required: true })
  @IsString({ message: "Số điện thoại phải là một chuỗi" })
  @IsNotEmpty({ message: "Số điện thoại không được để trống" })
  @IsPhoneNumber("VN", { message: "Số điện thoại không hợp lệ" })
  phone: string;
}
