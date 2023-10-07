import { IdType } from "@/shared.constants";

export interface IJwtService<KeyType = IdType> {
  signJwtToken(userId: KeyType, username: string): Promise<string>;
}
