import { IdType } from "@/shared.constants";

export type keyType = string | number;

export class KeyDiffCache<T> {
  deletedKeys: IdType[] = [];
  updatedKeys: IdType[] = [];

  protected keyValueStore: { [key: string]: T } = {};

  public async getAllValues() {
    const keys = Object.keys(this.keyValueStore);
    return await this.getValuesBatch(keys);
  }

  public async getAllKeyValues() {
    return this.keyValueStore;
  }

  public async getValue(key: IdType): Promise<T> {
    const keyString = key?.toString();
    if (!keyString?.length) {
      throw new Error("Key must be a non-empty serializable string");
    }
    return this.keyValueStore[keyString];
  }

  async processStateDiffs() {
    const updatedKeys = [...this.updatedKeys];
    const updatedValues = await this.getValuesBatch(updatedKeys);
    const deletedKeys = [...this.deletedKeys];

    this.resetDiffs();
    return {
      updatedKeys,
      updatedValues,
      deletedKeys,
    };
  }

  protected async setKeyValuesBatch(keyValues: Array<{ key: IdType; value: T }>, markUpdated: boolean = true) {
    keyValues.forEach(({ key, value }) => {
      this.setKeyValue(key, value);
    });
    if (markUpdated) {
      const updatedKeys = keyValues.map(({ key }) => key);
      this.batchMarkUpdated(updatedKeys);
    }
  }

  protected async deleteKeysBatch(keys: Array<IdType>, markDeleted: boolean = true) {
    keys.forEach((key) => {
      this.deleteKeyValue(key);
    });
    if (markDeleted) {
      this.batchMarkDeleted(keys);
    }
  }

  protected async getValuesBatch(keys: Array<IdType>): Promise<Array<T>> {
    const keyStrings = keys.map((key) => key?.toString());
    if (keyStrings.some((key) => !key?.length)) {
      throw new Error("Key must be a non-empty serializable string, and one of them is not");
    }

    const values = [];
    for (const keyString of keyStrings) {
      const value = await this.getValue(keyString.toString());
      values.push(value);
    }
    return values as Array<T>;
  }

  protected async setKeyValue(key: IdType, value: T, markUpdated: boolean = true) {
    const keyString = this.convertToKeyString(key);
    if (!keyString?.length) {
      throw new Error("Key must be a non-empty serializable string");
    }

    this.keyValueStore[keyString] = value;
    if (markUpdated) {
      this.markUpdated(keyString);
    }
  }

  protected async deleteKeyValue(key: IdType, markDeleted: boolean = true) {
    const keyString = this.convertToKeyString(key);
    if (!keyString?.length) {
      throw new Error("Key must be a non-empty serializable string");
    }

    delete this.keyValueStore[keyString];
    if (markDeleted) {
      this.markDeleted(keyString);
    }
  }

  protected batchMarkDeleted(keys: IdType[]) {
    for (const key of keys) {
      this.markDeleted(key);
    }
  }

  protected markUpdated(key: IdType) {
    if (this.deletedKeys.includes(key)) {
      this.deletedKeys.splice(this.deletedKeys.indexOf(key), 1);
    }
    if (!this.updatedKeys.includes(key)) {
      this.updatedKeys.push(key);
    }
  }

  protected markDeleted(key: IdType) {
    if (this.updatedKeys.includes(key)) {
      this.updatedKeys.splice(this.updatedKeys.indexOf(key), 1);
    }
    if (!this.deletedKeys.includes(key)) {
      this.deletedKeys.push(key);
    }
  }

  private convertToKeyString(key: IdType) {
    return key?.toString();
  }

  protected resetDiffs() {
    this.deletedKeys = [];
    this.updatedKeys = [];
  }

  private batchMarkUpdated(keys: IdType[]) {
    for (const key of keys) {
      this.markUpdated(key);
    }
  }
}
