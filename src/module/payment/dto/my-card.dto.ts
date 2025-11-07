import { OmitType } from "@nestjs/swagger";
import { Card } from "../_entities/card.entity";

export class MyCardDto {}

export class MyCardResponseDto extends OmitType(Card, [
  "account",
  "historySend",
  "historyReceive",
]) {}
