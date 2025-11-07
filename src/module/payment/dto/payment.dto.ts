import {
  IsDecimal,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from "class-validator";
import { HistoryPayment } from "../_entities/history-payment.entity";

export class PaymentDto {
  @IsString()
  @IsNotEmpty()
  cardReceive: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;
}

export class PaymentResponseDto {
  message: string;
  error: boolean;
  history: HistoryPayment | null;
}
