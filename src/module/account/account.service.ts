import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Not, Repository } from "typeorm";
import { AccountEntity } from "./_entities/account.entity";
import { ProfileEntity } from "../profile/_entities/profile.entity";
import { RegisterDtoRequest, RegisterDtoResponse } from "./dto/register.dto";

import { hashPassword } from "@/common/util/bcrypt.util";
import { plainToInstance } from "class-transformer";
import {
  ChangePasswordDto,
  ChangePasswordDtoResponse,
} from "./dto/change-password.dto";
import { JwtPayload } from "../auth/payload.type";

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,

    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,

    private readonly dataSource: DataSource,
  ) {}

  async register(data: RegisterDtoRequest): Promise<RegisterDtoResponse> {
    return this.dataSource.transaction(async (manager) => {
      const passwordHash = await hashPassword(data.password);

      const account = manager.create(AccountEntity, {
        ...data,
        password: passwordHash,
      });

      const savedAccount = await manager.save(AccountEntity, account);

      const profile = manager.create(ProfileEntity, { account: savedAccount });

      await manager.save(ProfileEntity, profile);

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
  async findOne(identifier: string): Promise<AccountEntity> {
    const account = await this.accountRepository.findOne({
      where: [{ username: identifier }, { email: identifier }],
      relations: {
        profile: true,
      },
      select: {
        password: true,
        id: true,
        username: true,
        email: true,
        profile: true,
      },
    });

    if (!account) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return account;
  }

  async findById(id: number): Promise<AccountEntity> {
    const account = await this.accountRepository.findOne({
      where: { id },
      relations: {
        profile: true,
      },
      select: {
        password: false,
        id: true,
        username: true,
        email: true,
        profile: true,
      },
    });

    if (!account) {
      throw new NotFoundException("Account not found");
    }
    return account;
  }
}
