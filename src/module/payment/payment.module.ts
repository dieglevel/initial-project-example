import { Module } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HistoryPayment } from "./_entities/history-payment.entity";
import { Card } from "./_entities/card.entity";

@Module({
  imports: [TypeOrmModule.forFeature([HistoryPayment, Card])],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
