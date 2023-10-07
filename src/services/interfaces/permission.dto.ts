import { IdType } from "@/shared.constants";

export class PermissionDto<KeyType = IdType> {
  id: KeyType;
  name: string;
}
