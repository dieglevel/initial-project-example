import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { IsString } from "class-validator";
import { Account } from "./_entities/account.entity";
import { Profile } from "./_entities/profile.entity";
import { CreateAccountDto } from "./dto/create-account.dto";

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async createAccount(data: CreateAccountDto): Promise<Account> {
    const account = this.accountRepository.create(data);

    const profile = this.profileRepository.create();
    account.profile = profile;

    return this.accountRepository.save(account, {});
  }
}
