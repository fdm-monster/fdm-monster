import { compareSync, genSaltSync, hashSync } from "bcryptjs";

export function hashPassword(password: string) {
  const salt = genSaltSync(10);
  return hashSync(password, salt);
}

export function comparePasswordHash(password: string, passwordHash: string): boolean {
  if (!password?.length) return false;
  return compareSync(password, passwordHash);
}
