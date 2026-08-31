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
    // Delete existing token entries for this user & type & mode
    await this.repository.delete({
      userId,
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

    // Asynchronously clean expired tokens
    this.cleanExpiredTokens();
  }

  async removeToken(
    userId: number,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<void> {
    await this.repository.delete({
      userId,
      tokenType,
      mode,
    });
  }

  async validateToken(
    userId: number,
    token: string,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<boolean> {
    const now = new Date();

    if (mode === "whitelist") {
      const record = await this.repository.findOne({
        where: {
          userId,
          tokenType,
          mode: "whitelist",
          token,
          expiresAt: MoreThan(now),
        },
      });

      return !!record;
    } else {
      // Blacklist mode: check if token is blacklisted
      const blacklisted = await this.repository.findOne({
        where: {
          userId,
          tokenType,
          mode: "blacklist",
          token,
          expiresAt: MoreThan(now),
        },
      });

      // Valid if NOT blacklisted
      return !blacklisted;
    }
  }

  async getToken(
    userId: number,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<string | null> {
    const now = new Date();
    const record = await this.repository.findOne({
      where: {
        userId,
        tokenType,
        mode,
        expiresAt: MoreThan(now),
      },
      order: { createdAt: "DESC" },
    });

    return record ? record.token : null;
  }
}
