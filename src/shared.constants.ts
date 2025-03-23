export type SqliteIdType = number;

export type IdType = SqliteIdType;

export class IdDto<KeyType = IdType> {
  id: KeyType;
}
