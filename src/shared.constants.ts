export type SqliteIdType = number;

export type MongoIdType = string;

export type IdType = SqliteIdType | MongoIdType;

export class IdDto {
  id: IdType;
}
