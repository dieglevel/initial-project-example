import { Injectable } from "@nestjs/common";
import { CreateAccount_RequestDto } from "./dto/request.dto";
import {
  CreateAccount_ResponseDto,
  GetSomething_ResponseDto,
} from "./dto/response.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Account } from "src/entity/schema/account.entity";
import { Profile } from "src/entity/schema/profile.entity";
import { hashPassword } from "src/util/bcrypt.util";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async createAccount(
    data: CreateAccount_RequestDto,
  ): Promise<CreateAccount_ResponseDto> {
    const passwordHash = await hashPassword(data.password);

    const account = new Account();
    account.email = data.email;
    account.phone = data.phone;
    account.password = passwordHash;

    const response = await this.accountRepository.save(account);

    const result: CreateAccount_ResponseDto = {
      email: response.email,
      phone: response.phone,
    };

    return result;
  }

  async getSomething(): Promise<GetSomething_ResponseDto> {
    // Simulate fetching some data
    return {
      data: "some data",
      timestamp: new Date().toISOString(),
    };
  }
}
