import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Card } from "./_entities/card.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Equal, Repository } from "typeorm";
import { HistoryPayment } from "./_entities/history-payment.entity";
import { MyCardDto, MyCardResponseDto } from "./dto/my-card.dto";
import { PaymentDto, PaymentResponseDto } from "./dto/payment.dto";

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,

    @InjectRepository(HistoryPayment)
    private readonly historyPaymentRepository: Repository<HistoryPayment>,

    private readonly dataSource: DataSource,
  ) {}

  async myCard(userId: string): Promise<MyCardResponseDto> {
    const card = await this.cardRepository.findOne({
      where: {
        account: Equal(userId),
      },
    });
    if (!card) {
      throw new NotFoundException("Card not found");
    }
    return card;
  }

  async payment(userId: string, data: PaymentDto): Promise<PaymentResponseDto> {
    try {
      return this.dataSource.transaction(async (manager) => {
        const cardSend = await this.cardRepository.findOne({
          where: {
            account: {
              id: Equal(userId),
            },
          },
        });
        if (!cardSend) {
          throw new NotFoundException("Your card not found");
        }

        const cardReceive = await this.cardRepository.findOne({
          where: {
            id: Equal(data.cardReceive),
          },
        });

        if (!cardReceive) {
          throw new NotFoundException("Receiving card not found");
        }

        if (cardSend.amount < data.amount) {
          throw new BadRequestException("Insufficient funds");
        }

        cardSend.amount -= data.amount;
        cardReceive.amount += data.amount;

        await manager.save(cardSend);
        await manager.save(cardReceive);
        const history = this.historyPaymentRepository.create({
          cardSend: cardSend,
          cardReceive: cardReceive,
          amount: data.amount,
        });
        await manager.save(history);

        throw new NotFoundException("test exception");
      });
    } catch (error) {
      return {
        message: "Payment failed",
        error: true,
        history: null,
      };
    }
  }
}
