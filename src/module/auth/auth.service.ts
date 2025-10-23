import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AccountService } from "./account.service";
import { SignInDto, SignInDtoResponse } from "./dto/sign-in.dto";
import { JwtPayload } from "./payload.type";

@Injectable()
export class AuthService {
  constructor(
    private readonly accountService: AccountService,

    private jwtService: JwtService,
  ) {}

  async signIn(data: SignInDto): Promise<SignInDtoResponse> {
    const user = await this.accountService.findOne(data.identifier);

    if (user?.password !== data.password) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const payload: JwtPayload = { sub: user.id };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
