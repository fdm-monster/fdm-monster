import * as bcrypt from "bcrypt";

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function comparePasswordHash(password: string, passwordHash: string): boolean {
  return bcrypt.compareSync(password, passwordHash);
}
