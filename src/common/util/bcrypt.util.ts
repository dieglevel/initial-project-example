import * as bcrypt from "bcrypt";

const hashPassword = async (plainPassword: string): Promise<string> => {
  const salt = 10;
  const hashed = bcrypt.hashSync(plainPassword, salt);

  return hashed;
};

const comparePassword = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

export { hashPassword, comparePassword };
