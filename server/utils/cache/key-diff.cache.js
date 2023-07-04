class KeyDiffCache {
  /**
   * @type {string[]}
   */
  deletedKeys = [];
  /**
   * @type {string[]}
   */
  updatedKeys = [];

  /**
   * @protected
   * @type {{[key: string]: T}}
   */
  keyValueStore = {};

  /**
   * @protected
   * @param {Array<{key: string, value: T}>} keyValues
   * @param {boolean} markUpdated
   */
  async setKeyValuesBatch(keyValues, markUpdated = true) {
    keyValues.forEach(({ key, value }) => {
      this.setKeyValue(key, value);
    });
    if (markUpdated) {
      const updatedKeys = keyValues.map(({ key }) => key);
      this.batchMarkUpdated(updatedKeys);
    }
  }

  /**
   * @protected
   * @param {Array<string>} keys
   * @param {boolean} [markDeleted=true]
   */
  async deleteKeysBatch(keys, markDeleted = true) {
    keys.forEach((key) => {
      this.deleteKeyValue(key);
    });
    if (markDeleted) {
      this.batchMarkDeleted(keys);
    }
  }

  /**
   * @returns {Promise<Array<T>>}
   */
  async getAllValues() {
    const keys = Object.keys(this.keyValueStore);
    return this.getValuesBatch(keys);
  }

  async getAllKeyValues() {
    return this.keyValueStore;
  }

  /**
   * @public
   * @param {string} key
   * @returns {Promise<T>}
   */
  async getValue(key) {
    const keyString = key?.toString();
    if (!keyString?.length) {
      throw new Error("Key must be a non-empty serializable string");
    }
    return this.keyValueStore[keyString];
  }

  /**
   * @protected
   * @param {Array<string>} keys
   * @returns {Promise<Array<T>>}
   */
  async getValuesBatch(keys) {
    const keyStrings = keys.map((key) => key?.toString());
    if (keyStrings.some((key) => !key?.length)) {
      throw new Error("Key must be a non-empty serializable string, and one of them is not");
    }

    const values = [];
    for (const keyString of keyStrings) {
      const value = await this.getValue(keyString.toString());
      values.push(value);
    }
    return values;
  }

  /**
   * @protected
   * @param {string} key
   * @param {T} value
   * @param {boolean} [markUpdated=true]
   */
  async setKeyValue(key, value, markUpdated = true) {
    const keyString = key?.toString();
    if (!keyString?.length) {
      throw new Error("Key must be a non-empty serializable string");
    }

    this.keyValueStore[keyString] = value;
    if (markUpdated) {
      this.markUpdated(keyString);
    }
  }

  /**
   * @protected
   * @param {string} key
   * @param {boolean} [markDeleted=true]
   */
  async deleteKeyValue(key, markDeleted = true) {
    const keyString = key?.toString();
    if (!keyString?.length) {
      throw new Error("Key must be a non-empty serializable string");
    }

    delete this.keyValueStore[keyString];
    if (markDeleted) {
      this.markDeleted(keyString);
    }
  }

  /**
   * @private
   * @param {string[]} keys
   */
  batchMarkUpdated(keys) {
    for (const key of keys) {
      this.markUpdated(key);
    }
  }

  /**
   * @protected
   * @param {string[]} keys
   */
  batchMarkDeleted(keys) {
    for (const key of keys) {
      this.markDeleted(key);
    }
  }

  /**
   * @protected
   * @param {string} key
   */
  markUpdated(key) {
    if (this.deletedKeys.includes(key)) {
      this.deletedKeys.splice(this.deletedKeys.indexOf(key), 1);
    }
    if (!this.updatedKeys.includes(key)) {
      this.updatedKeys.push(key);
    }
  }

  /**
   * @protected
   * @param {string} key
   */
  markDeleted(key) {
    if (this.updatedKeys.includes(key)) {
      this.updatedKeys.splice(this.updatedKeys.indexOf(key), 1);
    }
    if (!this.deletedKeys.includes(key)) {
      this.deletedKeys.push(key);
    }
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

  /**
   * @private
   */
  resetDiffs() {
    this.deletedKeys = [];
    this.updatedKeys = [];
  }
}

module.exports = { KeyDiffCache };
