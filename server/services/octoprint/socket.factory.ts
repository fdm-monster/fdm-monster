const { DITokens } = require("../../container.tokens");

export class SocketFactory {
  /**
   * @type {Cradle}
   */
  cradle;
  constructor(cradle) {
    this.cradle = cradle;
  }

  /**
   * @returns {OctoPrintSockIoAdapter}
   */
  createInstance() {
    return this.cradle[DITokens.octoPrintSockIoAdapter];
  }
}

module.exports = {
  SocketFactory,
};
