import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Not, Repository } from "typeorm";
import { Account } from "./_entities/account.entity";
import { Profile } from "../profile/_entities/profile.entity";
import { RegisterDtoRequest, RegisterDtoResponse } from "./dto/register.dto";

import { hashPassword } from "src/common/util/bcrypt.util";
import { plainToInstance } from "class-transformer";
import {
  ChangePasswordDto,
  ChangePasswordDtoResponse,
} from "./dto/change-password.dto";
import { JwtPayload } from "../auth/payload.type";
import { Card } from "../payment/_entities/card.entity";

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,

    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,

    private readonly dataSource: DataSource,
  ) {}

  async register(data: RegisterDtoRequest): Promise<RegisterDtoResponse> {
    return this.dataSource.transaction(async (manager) => {
      const passwordHash = await hashPassword(data.password);

      const account = manager.create(Account, {
        ...data,
        password: passwordHash,
      });

      const savedAccount = await manager.save(Account, account);

      const profile = manager.create(Profile, { account: savedAccount });
      const card = manager.create(Card, { account: savedAccount });

      await manager.save(Profile, profile);
      await manager.save(Card, card);

      const { password, ...withoutPassword } = savedAccount;
      return plainToInstance(RegisterDtoResponse, withoutPassword);
    });
  }

  async changePassword(
    user: JwtPayload,
    data: ChangePasswordDto,
  ): Promise<ChangePasswordDtoResponse> {
    const account = await this.accountRepository.findOne({
      where: { id: user.sub },
    });

    if (!account) {
      throw new NotFoundException("Account not found");
    }
    account.password = await hashPassword(data.password);
    await this.accountRepository.save(account);

    return { success: true };
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
