import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Column, Entity, Index } from "typeorm";
import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";

@Entity("auth_tokens")
@ApiEntity()
export class AuthTokenEntity extends BaseEntity {
  @Column()
  @Index()
  userId: number;

  @Column({ type: "text" })
  @Index()
  token: string;

  @Column({ type: "varchar", length: 20 })
  tokenType: "accessToken" | "refreshToken";

  @Column({ type: "varchar", length: 20 })
  mode: "whitelist" | "blacklist";

  @Column({ type: "timestamp" })
  expiresAt: Date;
}
