import { PartialType } from "@nestjs/swagger";
import { FinancialNotificationEntity } from "../_entities/financial-notification.entity";

export class FinancialNotification_Create_Request extends PartialType(
  FinancialNotificationEntity,
) {}

export class FinancialNotification_Create_Response extends FinancialNotificationEntity {}
