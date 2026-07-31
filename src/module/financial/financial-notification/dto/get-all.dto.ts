import { OmitType } from "@nestjs/swagger";
import { FinancialNotificationEntity } from "../_entities/financial-notification.entity";

export class FinancialNotification_GetAll_Response extends OmitType(
  FinancialNotificationEntity,
  [],
) {}
