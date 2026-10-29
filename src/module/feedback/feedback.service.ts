import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { BaseCrudService } from "@/common/service/base-crud.service";
import { FeedbackEntity } from "./_entities/feedback.entity";
import { Feedback_Create_Request } from "./dto/create.dto";
import { FileEntity } from "@/module/static-file/_entities/file.entity";
import { AccountEntity } from "@/module/account/_entities/account.entity";
import { JwtPayload } from "@/module/auth/payload.type";
import { FEEDBACK_STATUS } from "./feedback.enum";
import { PaginationQuery } from "@/common/dto/interface/pagination.interface";

@Injectable()
export class FeedbackService extends BaseCrudService<FeedbackEntity> {
  constructor(
    @InjectRepository(FeedbackEntity)
    private readonly feedbackRepo: Repository<FeedbackEntity>,

    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,

    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
  ) {
    super(feedbackRepo);
  }

  /**
   * Submit feedback (Public or Authenticated)
   */
  async submitFeedback(
    dto: Feedback_Create_Request,
    user?: JwtPayload | null,
  ): Promise<FeedbackEntity> {
    let account: AccountEntity | null = null;
    let contactEmail = dto.contactEmail?.trim() || null;
    let contactName = dto.contactName?.trim() || null;

    if (user?.sub) {
      account = await this.accountRepo.findOne({
        where: { id: user.sub },
        relations: {
          profile: true,
        },
      });

      if (account) {
        if (!contactEmail) {
          contactEmail = account.email;
        }
        if (!contactName && account.profile) {
          const fullName = [account.profile.firstName, account.profile.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();
          contactName = fullName || account.username;
        }
      }
    }

    let files: FileEntity[] = [];
    if (dto.fileIds && dto.fileIds.length > 0) {
      files = await this.fileRepo.findBy({
        id: In(dto.fileIds),
      });

      // Mark files as permanent so cleanup cron does not delete them
      if (files.length > 0) {
        await this.fileRepo.update(
          { id: In(files.map((f) => f.id)) },
          { isTemporary: false },
        );
      }
    }

    const feedback = this.feedbackRepo.create({
      title: dto.title.trim(),
      content: dto.content.trim(),
      feature: dto.feature,
      type: dto.type,
      status: FEEDBACK_STATUS.PENDING,
      contactEmail,
      contactName,
      account: account ?? undefined,
      accountId: account?.id ?? null,
      files,
    });

    return await this.feedbackRepo.save(feedback);
  }

  /**
   * Update feedback status
   */
  async updateStatus(
    id: number,
    status: FEEDBACK_STATUS,
  ): Promise<FeedbackEntity> {
    const feedback = await this.findOne(id);
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    feedback.status = status;
    return await this.feedbackRepo.save(feedback);
  }

  /**
   * Get paginated feedbacks with relations and standard meta format
   */
  async getFeedbackPaging(pagination: PaginationQuery<FeedbackEntity>) {
    const result = await this.paging(pagination, {
      relations: (qb: any) => {
        qb.leftJoinAndSelect(`${qb.alias}.files`, "files");
        qb.leftJoinAndSelect(`${qb.alias}.account`, "account");
      },
    });

    return {
      data: result.items,
      meta: {
        total: result.totalItems,
        page: result.currentPage,
        limit: result.itemsPerPage,
        totalPages: result.totalPages,
      },
      items: result.items,
      totalItems: result.totalItems,
    };
  }
}
