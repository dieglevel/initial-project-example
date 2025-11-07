import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "src/common/decorator/api-swagger/api-base-response.decorator";
import { PaymentService } from "./payment.service";
import { MyCardResponseDto } from "./dto/my-card.dto";
import { CurrentUser } from "../auth/decorator/current-user.decorator";
import { JwtPayload } from "../auth/payload.type";
import { PaymentDto, PaymentResponseDto } from "./dto/payment.dto";

@Controller("payment")
@ApiBearerAuth("access-token")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get("my-card")
  @HttpCode(200)
  @ApiBaseResponse(MyCardResponseDto)
  async myCard(@CurrentUser() jwt: JwtPayload) {
    return this.paymentService.myCard(jwt.sub);
  }

  @Post("payment")
  @HttpCode(200)
  @ApiBaseResponse(PaymentResponseDto)
  async payment(@CurrentUser() jwt: JwtPayload, @Body() data: PaymentDto) {
    return this.paymentService.payment(jwt.sub, data);
  }
}
