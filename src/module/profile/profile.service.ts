import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { plainToInstance } from "class-transformer";
import { ProfileEntity } from "./_entities/profile.entity";
import { MeDto, MeDtoResponse } from "./dto/me.dto";
import { Profile_Update_Request } from "./dto/update.dto";
import { FileEntity } from "../static-file/_entities/file.entity";
import { StaticFileService } from "../static-file/static-file.service";

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,

    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly staticFileService: StaticFileService,
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

  // Patch profile
  async updateProfile(
    userId: number,
    updateData: Profile_Update_Request,
  ): Promise<ProfileEntity> {
    const profile = await this.profileRepository.findOne({
      where: { account: { id: userId } },
    });

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    // Capture the old avatar ID before replacing it.
    const oldAvatarId = profile.avatar?.id;

    if (updateData.avatarId != null) {
      const avatar = await this.fileRepository.findOne({
        where: { id: updateData.avatarId },
      });

      if (!avatar) {
        throw new NotFoundException("Avatar file not found");
      }

      const resultAvatar = await this.staticFileService.markAsPermanent(
        avatar.id,
        undefined,
        oldAvatarId !== avatar.id ? oldAvatarId : undefined,
      );
      // Assign the new avatar.
      profile.avatar = resultAvatar;
    }

    const updatedProfile = this.profileRepository.merge(profile, updateData);

    return this.profileRepository.save(updatedProfile);
  }
}
