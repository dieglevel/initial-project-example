import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AccountService } from "../account/account.service";
import { SignInDto, SignInDtoResponse } from "./dto/sign-in.dto";
import { JwtPayload } from "./payload.type";
import { comparePassword } from "@/common/util/bcrypt.util";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  authAccessTokenCacheExpiresIn,
  authRefreshTokenCacheExpiresIn,
  authRefreshTokenCacheKey,
} from "./auth.cache";
import { LogOutDto, LogOutDtoResponse } from "./dto/log-out.dto";
import {
  RefreshTokenDto,
  RefreshTokenDtoResponse,
} from "./dto/refresh-token.dto";
import { jwtConfig } from "@/common/environment/types/jwt.type";
import type { ConfigType } from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(
    private readonly accountService: AccountService,

    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,

    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
  ) {}

  private getAccessTokenCacheKey(userId: number) {
    const accessTokenCacheMode =
      this.config.AUTH_ACCESS_TOKEN_CACHE_MODE === "blacklist"
        ? "blacklist"
        : "whitelist";

    return `auth:${userId}:${accessTokenCacheMode}:accessToken`;
  }

  async signIn(data: SignInDto): Promise<SignInDtoResponse> {
    const user = await this.accountService.findOne(data.identifier);

    if ((await comparePassword(data.password, user.password)) === false) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const payload: JwtPayload = { sub: user.id };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: `${authAccessTokenCacheExpiresIn}s`,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: `${authRefreshTokenCacheExpiresIn}s`,
    });

    const isBlacklistMode =
      this.config.AUTH_ACCESS_TOKEN_CACHE_MODE === "blacklist";

    if (isBlacklistMode === false) {
      await this.cacheManager.set(
        this.getAccessTokenCacheKey(user.id),
        accessToken,
        authAccessTokenCacheExpiresIn,
      );
    } else {
      await this.cacheManager.del(this.getAccessTokenCacheKey(user.id));
    }

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
    const isBlacklistMode =
      this.config.AUTH_ACCESS_TOKEN_CACHE_MODE === "blacklist";

    if (isBlacklistMode === false) {
      await this.cacheManager.del(this.getAccessTokenCacheKey(data.userId));
    } else {
      await this.cacheManager.set(
        this.getAccessTokenCacheKey(data.userId),
        true,
        authAccessTokenCacheExpiresIn,
      );
    }
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
      expiresIn: `${authAccessTokenCacheExpiresIn}s`,
    });
    const newRefreshToken = await this.jwtService.signAsync(newPayload, {
      expiresIn: `${authRefreshTokenCacheExpiresIn}s`,
    });

    const isBlacklistMode =
      this.config.AUTH_ACCESS_TOKEN_CACHE_MODE === "blacklist";

    if (isBlacklistMode === false) {
      await this.cacheManager.set(
        this.getAccessTokenCacheKey(payload.sub),
        newAccessToken,
        authAccessTokenCacheExpiresIn,
      );
    } else {
      await this.cacheManager.del(this.getAccessTokenCacheKey(payload.sub));
    }

    await this.cacheManager.set(
      authRefreshTokenCacheKey(payload.sub),
      newRefreshToken,
      authRefreshTokenCacheExpiresIn,
    );

    const user = await this.accountService.findById(payload.sub);

    if (!user.profile) {
      throw new UnauthorizedException("User not found");
    }

    return {
      accessToken: newAccessToken,
      user: user.profile,
      refreshToken: newRefreshToken,
    };
  }

  async validateUser(token: string): Promise<JwtPayload> {
    const payload: JwtPayload = await this.jwtService.verifyAsync(token);
    const isBlacklistMode =
      this.config.AUTH_ACCESS_TOKEN_CACHE_MODE === "blacklist";

    if (isBlacklistMode === false) {
      const cachedToken = await this.cacheManager.get<string>(
        this.getAccessTokenCacheKey(payload.sub),
      );

      if (cachedToken !== token) {
        throw new UnauthorizedException("Invalid token");
      }
    } else {
      const blacklistedToken = await this.cacheManager.get<boolean>(
        this.getAccessTokenCacheKey(payload.sub),
      );

      if (blacklistedToken === true) {
        throw new UnauthorizedException("Invalid token");
      }
    }

    return payload;
  }
}
