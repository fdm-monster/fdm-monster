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

  processStateDiffs() {
    const updatedKes = [...this.updatedKeys];
    const deletedKeys = [...this.deletedKeys];
    this.resetDiffs();
    return {
      updatedKes,
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
