import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "src/common/decorator/api-base-response.decorator";
import { ApiErrorResponses } from "src/common/decorator/api-error-response.decorator";
import { CreateAccount_RequestDto } from "./dto/request.dto";
import {
  CreateAccount_ResponseDto,
  GetSomething_ResponseDto,
} from "./dto/response.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly AuthService: AuthService) {}

  @Post("create-account")
  @HttpCode(200)
  @ApiBaseResponse(CreateAccount_ResponseDto)
  @ApiErrorResponses()
  async create(
    @Body() data: CreateAccount_RequestDto,
  ): Promise<CreateAccount_ResponseDto> {
    return await this.AuthService.createAccount(data);
  }

  @Get("get-something")
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiBaseResponse(GetSomething_ResponseDto)
  async getSomething(): Promise<GetSomething_ResponseDto> {
    return await this.AuthService.getSomething();
  }
}
