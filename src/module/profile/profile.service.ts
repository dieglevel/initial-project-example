import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { plainToInstance } from "class-transformer";
import { ProfileEntity } from "./_entities/profile.entity";
import { MeDto, MeDtoResponse } from "./dto/me.dto";

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  async me({ userId }: MeDto): Promise<MeDtoResponse> {
    const profile = await this.profileRepository.findOne({
      where: { account: { id: userId } },
      relations: {
        avatar: true,
      },
    });

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    return profile;
  }
}
