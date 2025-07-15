import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity } from "../base-entity.entity";
import { Profile } from "./profile.entity";

@Entity({ name: "account" })
export class Account extends BaseEntity {
  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ type: "varchar" })
  password: string;

  @Column({ type: "varchar", length: 15 })
  phone: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @OneToOne(() => Profile, (profile) => profile.account)
  @JoinColumn({ name: "profile_id" })
  profile: Profile;
}
