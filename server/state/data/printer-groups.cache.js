/**
 * A generic cache for printer groups
 */
class PrinterGroupsCache {
  // Data array
  #printerGroups = [];

  #printerGroupService;

  constructor({ printerGroupService }) {
    this.#printerGroupService = printerGroupService;
  }

  getGroupId(groupId) {
    if (!this.#printerGroups) return;

    return this.#printerGroups.find((pg) => pg._id.toString() === groupId);
  }

  getCache() {
    return this.#printerGroups;
  }

  async loadCache() {
    this.#printerGroups = await this.#printerGroupService.list();
  }
}

module.exports = PrinterGroupsCache;
