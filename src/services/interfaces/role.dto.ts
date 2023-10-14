import { IdType } from "@/shared.constants";

export class RoleDto<KeyType = IdType> {
  id: KeyType;
  name: string;
}
