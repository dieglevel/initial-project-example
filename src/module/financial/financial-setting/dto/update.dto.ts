import { PartialType } from "@nestjs/swagger/dist/type-helpers/partial-type.helper";
import { FinancialSettingEntity } from "../_entities/financial-setting.entity";

export class FinancialSetting_Update_Request extends PartialType(
  FinancialSettingEntity,
) {}

export class FinancialSetting_Update_Response extends FinancialSettingEntity {}
