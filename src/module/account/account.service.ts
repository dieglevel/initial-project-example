import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Account } from "./_entities/account.entity";
import { Profile } from "../profile/_entities/profile.entity";
import { RegisterDtoRequest, RegisterDtoResponse } from "./dto/register.dto";

import { hashPassword } from "src/common/util/bcrypt.util";
import { plainToInstance } from "class-transformer";

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async register(data: RegisterDtoRequest): Promise<RegisterDtoResponse> {
    const passwordHash = await hashPassword(data.password);

    const account = this.accountRepository.create({
      ...data,
      password: passwordHash,
    });

    const profile = this.profileRepository.create();
    account.profile = profile;

    const result = await this.accountRepository.save(account);

    // strip password before returning
    const { password, ...withoutPassword } = result;

    return plainToInstance(RegisterDtoResponse, withoutPassword, {});
  }

  // Other methods
  async findOne(identifier: string): Promise<Account> {
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
      throw new UnauthorizedException("Invalid credentials");
    }
    return account;
  }
}
