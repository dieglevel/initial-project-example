import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { CreateGenericController } from "@/common/controller/base-crud.controller";
import { FinancialNotificationEntity } from "./_entities/financial-notification.entity";
import {
  FinancialNotification_Create_Request,
  FinancialNotification_Create_Response,
} from "./dto/create.dto";
import {
  FinancialNotification_Update_Request,
  FinancialNotification_Update_Response,
} from "./dto/update.dto";
import { FinancialNotification_GetAll_Response } from "./dto/get-all.dto";
import { FinancialNotification_Paging_Response } from "./dto/paging.dto";
import { FinancialNotification_Delete_Response } from "./dto/delete.dto";
import { FinancialNotificationService } from "./financial-notification.service";
import { CurrentUser } from "@/module/auth/decorator/current-user.decorator";
import type { JwtPayload } from "@/module/auth/payload.type";
import { FinancialNotification_MarkRead_Response } from "./dto/mark-read.dto";
import { FinancialNotification_RunSmartAlerts_Response } from "./dto/run-smart-alerts.dto";

@Controller("financial-notification")
@ApiBearerAuth("access-token")
export class FinancialNotificationController extends CreateGenericController({
  entity: FinancialNotificationEntity,
  dto: {
    create: FinancialNotification_Create_Request,
    update: FinancialNotification_Update_Request,
  },
  responses: {
    getAll: FinancialNotification_GetAll_Response,
    create: FinancialNotification_Create_Response,
    paging: FinancialNotification_Paging_Response,
    update: FinancialNotification_Update_Response,
    delete: FinancialNotification_Delete_Response,
  },
  excludeSearch: [],
}) {
  constructor(
    private readonly financialNotificationService: FinancialNotificationService,
  ) {
    super(financialNotificationService);
  }

  @Get("/unread")
  @HttpCode(200)
  @ApiBaseResponse(FinancialNotification_GetAll_Response, {
    isArray: true,
  })
  async getUnread(@CurrentUser() user: JwtPayload) {
    return this.financialNotificationService.getUnread(user);
  }

  @Post("/mark-read/:id")
  @HttpCode(200)
  @ApiBaseResponse(FinancialNotification_MarkRead_Response)
  async markRead(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialNotificationService.markAsRead(id, user);
  }

  @Post("/run-smart-alerts")
  @HttpCode(200)
  @ApiBaseResponse(FinancialNotification_RunSmartAlerts_Response)
  async runSmartAlerts(@CurrentUser() user: JwtPayload) {
    return this.financialNotificationService.runSmartAlertsForAccount(user);
  }
}
