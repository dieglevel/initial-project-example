import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Account } from "./_entities/account.entity";
import { Profile } from "./_entities/profile.entity";
import {
  CreateAccountDtoRequest,
  CreateAccountDtoResponse,
} from "./dto/create-account.dto";
import {
  FindAccountByIdentifierDto,
  FindAccountByIdentifierDtoResponse,
} from "./dto/find-account-by-identifier.dto";

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async register(
    data: CreateAccountDtoRequest,
  ): Promise<CreateAccountDtoResponse> {
    const account = this.accountRepository.create(data);

    const profile = this.profileRepository.create();
    account.profile = profile;

    return this.accountRepository.save(account, {});
  }

  // Other methods
  async findOne(identifier: string): Promise<Account | null> {
    const account = await this.accountRepository.findOne({
      where: [{ username: identifier }, { email: identifier }],
      select: {
        password: true,
        id: true,
        username: true,
        email: true,
      },
    });

    if (!account) {
      return null;
    }
    return account;
  }

  async me(accountId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { account: { id: accountId } },
    });

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    return profile;
  }
}
