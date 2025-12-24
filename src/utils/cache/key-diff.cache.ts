export class KeyDiffCache<T> {
  deletedKeys: number[] = [];
  updatedKeys: number[] = [];

  protected keyValueStore = new Map<number, T>();

  public async getAllValues(): Promise<T[]> {
    return Array.from(this.keyValueStore.values());
  }

  public async getAllKeyValues() {
    return this.keyValueStore;
  }

  public async getValue(key: number): Promise<T | undefined> {
    return this.keyValueStore.get(key);
  }

  protected async setKeyValuesBatch(keyValues: Array<{ key: number; value: T }>, markUpdated: boolean = true) {
    for (const { key, value } of keyValues) {
      await this.setKeyValue(key, value, false);
    }
    if (markUpdated) {
      const updatedKeys = keyValues.map(({ key }) => key);
      this.batchMarkUpdated(updatedKeys);
    }
  }

  protected async deleteKeysBatch(keys: number[], markDeleted: boolean = true) {
    for (const key of keys) {
      await this.deleteKeyValue(key, false);
    }
    if (markDeleted) {
      this.batchMarkDeleted(keys);
    }
  }

  protected async setKeyValue(key: number, value: T, markUpdated: boolean = true) {
    this.keyValueStore.set(key, value);
    if (markUpdated) {
      this.markUpdated(key);
    }
  }

  protected async deleteKeyValue(key: number, markDeleted: boolean = true) {
    this.keyValueStore.delete(key);
    if (markDeleted) {
      this.markDeleted(key);
    }
  }

  protected batchMarkDeleted(keys: number[]) {
    for (const key of keys) {
      this.markDeleted(key);
    }
  }

  protected markUpdated(key: number) {
    const deletedIndex = this.deletedKeys.indexOf(key);
    if (deletedIndex !== -1) {
      this.deletedKeys.splice(deletedIndex, 1);
    }
    if (!this.updatedKeys.includes(key)) {
      this.updatedKeys.push(key);
    }
  }

  protected markDeleted(key: number) {
    const updatedIndex = this.updatedKeys.indexOf(key);
    if (updatedIndex !== -1) {
      this.updatedKeys.splice(updatedIndex, 1);
    }
    if (!this.deletedKeys.includes(key)) {
      this.deletedKeys.push(key);
    }
  }

  protected resetDiffs() {
    this.deletedKeys = [];
    this.updatedKeys = [];
  }

  private batchMarkUpdated(keys: number[]) {
    for (const key of keys) {
      this.markUpdated(key);
    }
  }
}
