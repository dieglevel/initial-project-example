import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { Public } from "../auth/decorator/public.decorator";
import { FeedbackService } from "./feedback.service";
import {
  Feedback_Create_Request,
  Feedback_Create_Response,
} from "./dto/create.dto";
import {
  Feedback_Update_Request,
  Feedback_Update_Response,
} from "./dto/update.dto";
import { Feedback_Delete_Response } from "./dto/delete.dto";
import { Feedback_GetAll_Response } from "./dto/get-all.dto";
import { Feedback_Paging_Response } from "./dto/paging.dto";
import { FEEDBACK_STATUS } from "./feedback.enum";
import { JwtPayload } from "../auth/payload.type";
import { Pagination } from "@/common/decorator/pagination/pagination.decorator";
import { PaginationQuery } from "@/common/dto/interface/pagination.interface";
import { FeedbackEntity } from "./_entities/feedback.entity";
import { ApiPagination } from "@/common/decorator/pagination/api-pagination.decorator";

@ApiTags("Feedback")
@Controller("feedback")
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Submit feedback.
   * Public endpoint — anyone can submit feedback (anonymous or authenticated).
   */
  @Public()
  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: "Submit user feedback (Public / anyone can send)",
  })
  @ApiBaseResponse(Feedback_Create_Response)
  async submit(
    @Body() dto: Feedback_Create_Request,
    @Req() req: Request,
  ): Promise<FeedbackEntity> {
    let user: JwtPayload | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = this.jwtService.verify<JwtPayload>(token);
        if (decoded?.sub) {
          user = decoded;
        }
      } catch {
        // Silently ignore decode error for public submissions
        user = null;
      }
    }

    return await this.feedbackService.submitFeedback(dto, user);
  }

  /**
   * Paginated list of feedbacks (Public / anyone can view)
   */
  @Public()
  @Get("paging")
  @HttpCode(200)
  @ApiOperation({ summary: "Get paginated feedbacks" })
  @ApiBaseResponse(Feedback_Paging_Response)
  @ApiPagination(FeedbackEntity, {
    excludeSearch: [],
    excludeOrder: [],
  })
  async getPaging(@Pagination() pagination: PaginationQuery<FeedbackEntity>) {
    return this.feedbackService.getFeedbackPaging(pagination);
  }

  /**
   * Get single feedback by ID
   */
  @Get(":id")
  @HttpCode(200)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get feedback details by ID" })
  @ApiBaseResponse(Feedback_GetAll_Response)
  async getOne(@Param("id", ParseIntPipe) id: number) {
    return this.feedbackService.findOne(id, {
      relations: {
        files: true,
        account: {
          profile: true,
        },
      },
    });
  }

  /**
   * Update feedback status (e.g. IN_REVIEW, RESOLVED, REJECTED)
   */
  @Patch(":id/status")
  @HttpCode(200)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Update feedback resolution status" })
  @ApiBaseResponse(Feedback_Update_Response)
  async updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body("status") status: FEEDBACK_STATUS,
  ) {
    return this.feedbackService.updateStatus(id, status);
  }

  /**
   * Delete feedback
   */
  @Delete(":id")
  @HttpCode(200)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Delete feedback" })
  @ApiBaseResponse(Feedback_Delete_Response)
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.feedbackService.delete(id);
    return {
      message: "Feedback deleted successfully",
      isDeleted: true,
    };
  }
}
