import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ApiEntity } from "src/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "src/common/global-entity/base-entity.entity";
import { Column, Entity, OneToOne } from "typeorm";
import { Profile } from "../../profile/_entities/profile.entity";

@Entity()
@ApiEntity()
export class Account extends BaseEntity {
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

  @OneToOne(() => Profile, (profile) => profile.account, {
    cascade: true,
    onDelete: "CASCADE",
    eager: true,
  })
  @ApiPropertyOptional({ type: () => Profile, default: "Profile" })
  profile?: Profile;
}
