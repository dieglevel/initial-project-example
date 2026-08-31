import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, MoreThan, Repository } from "typeorm";
import { AuthTokenEntity } from "../_entities/auth-token.entity";
import {
  IJwtTokenStorageService,
  TokenMode,
  TokenType,
} from "./token-storage.interface";

@Injectable()
export class DatabaseTokenStorageService implements IJwtTokenStorageService {
  constructor(
    @InjectRepository(AuthTokenEntity)
    private readonly repository: Repository<AuthTokenEntity>,
  ) {}

  private async cleanExpiredTokens(): Promise<void> {
    try {
      await this.repository.delete({
        expiresAt: LessThan(new Date()),
      });
    } catch {
      // Ignore background cleanup errors
    }
  }

  async saveToken(
    userId: number,
    token: string,
    tokenType: TokenType,
    ttlSeconds: number,
    mode: TokenMode,
  ): Promise<void> {
    // Delete existing identical token if re-saving
    await this.repository.delete({
      userId,
      token,
      tokenType,
      mode,
    });

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const newToken = this.repository.create({
      userId,
      token,
      tokenType,
      mode,
      expiresAt,
    });

    await this.repository.save(newToken);

    // Clean expired tokens in background
    this.cleanExpiredTokens();
  }

  async removeToken(
    userId: number,
    token: string,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<void> {
    if (!token) return;

    await this.repository.delete({
      userId,
      token,
      tokenType,
      mode,
    });
  }

  async removeAllUserTokens(userId: number): Promise<void> {
    await this.repository.delete({ userId });
  }

  async validateToken(
    userId: number,
    token: string,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<boolean> {
    if (!token) return false;
    const now = new Date();

    if (mode === "whitelist") {
      const record = await this.repository.findOne({
        where: {
          userId,
          token,
          tokenType,
          mode: "whitelist",
          expiresAt: MoreThan(now),
        },
      });

      return !!record;
    } else {
      // Blacklist mode: check if this specific token is in blacklist
      const blacklisted = await this.repository.findOne({
        where: {
          userId,
          token,
          tokenType,
          mode: "blacklist",
          expiresAt: MoreThan(now),
        },
      });

      return !blacklisted;
    }
  }
}
