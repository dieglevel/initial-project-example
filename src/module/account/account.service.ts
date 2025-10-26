import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
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
