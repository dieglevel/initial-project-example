import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigType } from "@nestjs/config";
import { jwtConfig } from "@/common/environment/types/jwt.type";
import { comparePassword } from "@/common/util/bcrypt.util";
import { AccountService } from "../account/account.service";
import { SignInDto, SignInDtoResponse } from "./dto/sign-in.dto";
import { LogOutDto, LogOutDtoResponse } from "./dto/log-out.dto";
import {
  RefreshTokenDto,
  RefreshTokenDtoResponse,
} from "./dto/refresh-token.dto";
import { JwtPayload } from "./payload.type";
import {
  authAccessTokenCacheExpiresIn,
  authRefreshTokenCacheExpiresIn,
} from "./auth.cache";
import {
  IJwtTokenStorageService,
  TOKEN_STORAGE_SERVICE,
  TokenMode,
} from "./storage/token-storage.interface";

@Injectable()
export class AuthService {
  constructor(
    private readonly accountService: AccountService,
    private jwtService: JwtService,

    @Inject(TOKEN_STORAGE_SERVICE)
    private readonly tokenStorage: IJwtTokenStorageService,

    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
  ) {}

  private get mode(): TokenMode {
    return this.config.AUTH_ACCESS_TOKEN_CACHE_MODE === "blacklist"
      ? "blacklist"
      : "whitelist";
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

    const isBlacklistMode = this.mode === "blacklist";

    if (!isBlacklistMode) {
      // Whitelist mode: store new device's active access token & refresh token
      await this.tokenStorage.saveToken(
        user.id,
        accessToken,
        "accessToken",
        authAccessTokenCacheExpiresIn,
        "whitelist",
      );
      await this.tokenStorage.saveToken(
        user.id,
        refreshToken,
        "refreshToken",
        authRefreshTokenCacheExpiresIn,
        "whitelist",
      );
    }

    return {
      accessToken,
      refreshToken,
      user: user.profile,
    };
  }

  async logOut(data: LogOutDto): Promise<LogOutDtoResponse> {
    const isBlacklistMode = this.mode === "blacklist";

    if (!isBlacklistMode) {
      // Whitelist mode: remove current device's access token and refresh token
      if (data.accessToken) {
        await this.tokenStorage.removeToken(
          data.userId,
          data.accessToken,
          "accessToken",
          "whitelist",
        );
      }
      if (data.refreshToken) {
        await this.tokenStorage.removeToken(
          data.userId,
          data.refreshToken,
          "refreshToken",
          "whitelist",
        );
      }
    } else {
      // Blacklist mode: mark current device's tokens as blacklisted
      if (data.accessToken) {
        await this.tokenStorage.saveToken(
          data.userId,
          data.accessToken,
          "accessToken",
          authAccessTokenCacheExpiresIn,
          "blacklist",
        );
      }
      if (data.refreshToken) {
        await this.tokenStorage.saveToken(
          data.userId,
          data.refreshToken,
          "refreshToken",
          authRefreshTokenCacheExpiresIn,
          "blacklist",
        );
      }
    }

    return {
      success: true,
    };
  }

  async refreshToken(data: RefreshTokenDto): Promise<RefreshTokenDtoResponse> {
    const payload: JwtPayload = await this.jwtService.verifyAsync(
      data.refreshToken,
    );

    const isBlacklistMode = this.mode === "blacklist";

    // Check validity of current refresh token
    const isRefreshTokenValid = await this.tokenStorage.validateToken(
      payload.sub,
      data.refreshToken,
      "refreshToken",
      this.mode,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const newPayload: JwtPayload = { sub: payload.sub };

    const newAccessToken = await this.jwtService.signAsync(newPayload, {
      expiresIn: `${authAccessTokenCacheExpiresIn}s`,
    });
    const newRefreshToken = await this.jwtService.signAsync(newPayload, {
      expiresIn: `${authRefreshTokenCacheExpiresIn}s`,
    });

    if (!isBlacklistMode) {
      // Remove old refresh token from whitelist
      await this.tokenStorage.removeToken(
        payload.sub,
        data.refreshToken,
        "refreshToken",
        "whitelist",
      );
      // Save new tokens
      await this.tokenStorage.saveToken(
        payload.sub,
        newAccessToken,
        "accessToken",
        authAccessTokenCacheExpiresIn,
        "whitelist",
      );
      await this.tokenStorage.saveToken(
        payload.sub,
        newRefreshToken,
        "refreshToken",
        authRefreshTokenCacheExpiresIn,
        "whitelist",
      );
    } else {
      // Blacklist old refresh token
      await this.tokenStorage.saveToken(
        payload.sub,
        data.refreshToken,
        "refreshToken",
        authRefreshTokenCacheExpiresIn,
        "blacklist",
      );
    }

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

    const isValid = await this.tokenStorage.validateToken(
      payload.sub,
      token,
      "accessToken",
      this.mode,
    );

    if (!isValid) {
      throw new UnauthorizedException("Invalid token");
    }

    return payload;
  }
}
