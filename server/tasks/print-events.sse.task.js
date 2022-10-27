const { octoPrintWebsocketEvent } = require("../constants/event.constants");

class PrintEventsSseTask {
  #eventEmitter2;
  #sseHandler;

  constructor({ eventEmitter2, sseHandler }) {
    this.#eventEmitter2 = eventEmitter2;
    this.#sseHandler = sseHandler;

    let that = this;
    this.#eventEmitter2.on(octoPrintWebsocketEvent("*"), function (data1, data2) {
      that.handleMessage(this.event, data1, data2);
    });
  }

  handleMessage(fdmEvent, octoPrintEvent, data) {
    this.#sseHandler.send(JSON.stringify({ fdmEvent, octoPrintEvent, data }), "octoprint-events");
  }

  async run() {
    // Run once to bind event handler
  }
}

module.exports = {
  PrintEventsSseTask,
};
