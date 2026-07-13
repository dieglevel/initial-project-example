import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Column, Entity, OneToMany, OneToOne } from "typeorm";
import { ProfileEntity } from "../../profile/_entities/profile.entity";
import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";

@Entity()
@ApiEntity()
export class AccountEntity extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  @ApiProperty({ writeOnly: true })
  password: string;

  @Column({ default: false })
  @ApiPropertyOptional()
  isVerified: boolean;

  @OneToOne(() => ProfileEntity, (profile) => profile.account, {
    cascade: true,
    onDelete: "CASCADE",
    eager: true,
  })
  @ApiPropertyOptional({ type: () => ProfileEntity, default: "Profile" })
  profile?: ProfileEntity;
}
