import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AccountService } from "../account/account.service";
import { SignInDto, SignInDtoResponse } from "./dto/sign-in.dto";
import { JwtPayload } from "./payload.type";
import { comparePassword } from "src/common/util/bcrypt.util";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  authAccessTokenCacheExpiresIn,
  authAccessTokenCacheKey,
  authRefreshTokenCacheExpiresIn,
  authRefreshTokenCacheKey,
} from "./auth.cache";
import { LogOutDto, LogOutDtoResponse } from "./dto/log-out.dto";
import {
  RefreshTokenDto,
  RefreshTokenDtoResponse,
} from "./dto/refresh-token.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly accountService: AccountService,

    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async signIn(data: SignInDto): Promise<SignInDtoResponse> {
    const user = await this.accountService.findOne(data.identifier);

    if ((await comparePassword(data.password, user.password)) === false) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const payload: JwtPayload = { sub: user.id };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: authAccessTokenCacheExpiresIn,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: authRefreshTokenCacheExpiresIn,
    });

    await this.cacheManager.set(
      authAccessTokenCacheKey(user.id),
      accessToken,
      authAccessTokenCacheExpiresIn,
    );

    await this.cacheManager.set(
      authRefreshTokenCacheKey(user.id),
      refreshToken,
      authRefreshTokenCacheExpiresIn,
    );

    return {
      accessToken,
      refreshToken,
      user: user.profile,
    };
  }

  async logOut(data: LogOutDto): Promise<LogOutDtoResponse> {
    await this.cacheManager.del(authAccessTokenCacheKey(data.userId));
    await this.cacheManager.del(authRefreshTokenCacheKey(data.userId));

    return {
      success: true,
    };
  }

  async refreshToken(data: RefreshTokenDto): Promise<RefreshTokenDtoResponse> {
    const payload: JwtPayload = await this.jwtService.verifyAsync(
      data.refreshToken,
    );
    const cachedRefreshToken = await this.cacheManager.get<string>(
      authRefreshTokenCacheKey(payload.sub),
    );

    if (cachedRefreshToken !== data.refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const newPayload: JwtPayload = { sub: payload.sub };

    const newAccessToken = await this.jwtService.signAsync(newPayload, {
      expiresIn: authAccessTokenCacheExpiresIn,
    });
    const newRefreshToken = await this.jwtService.signAsync(newPayload, {
      expiresIn: authRefreshTokenCacheExpiresIn,
    });

    await this.cacheManager.set(
      authAccessTokenCacheKey(payload.sub),
      newAccessToken,
      authAccessTokenCacheExpiresIn,
    );

    await this.cacheManager.set(
      authRefreshTokenCacheKey(payload.sub),
      newRefreshToken,
      authRefreshTokenCacheExpiresIn,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async validateUser(token: string): Promise<JwtPayload> {
    const payload: JwtPayload = await this.jwtService.verifyAsync(token);
    const cachedToken = await this.cacheManager.get<string>(
      authAccessTokenCacheKey(payload.sub),
    );

    if (cachedToken !== token) {
      throw new UnauthorizedException("Invalid token");
    }

    return payload;
  }
}
