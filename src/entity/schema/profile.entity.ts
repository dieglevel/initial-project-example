import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity } from "../base-entity.entity";
import { Account } from "./account.entity";

@Entity({ name: "profile" })
export class Profile extends BaseEntity {
  @Column({ type: "varchar", length: 255, name: "full_name" })
  fullName: string;

  @Column({ type: "varchar", length: 255, unique: true })
  avatarUrl: string;

  @Column({ type: "date", name: "date_of_birth" })
  dateOfBirth: Date;

  @Column({ type: "enum", enum: ["male", "female"] })
  gender: "male" | "female";

  @OneToOne(() => Account, (account) => account.profile)
  @JoinColumn({ name: "account_id" })
  account: Account;
}
