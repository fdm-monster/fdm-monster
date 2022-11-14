const {
  octoPrintWebsocketCurrentEvent,
  PEVENTS,
  fdmMonsterPrinterStoppedEvent,
  fdmPrinterEventToPrinterId,
} = require("../constants/event.constants");
const {
  minBedTemp,
  maxBedTemp,
} = require("../controllers/validation/printer-files-controller.validation");

class BedTempOverrideTask {
  #bedTempOverrides = {}; // bedTemp, lastOverride, silencedOverrides
  // Time in msec between an override call
  #minDeltaTimeOverride = 10000;
  #resetSilencedOveridesMax = 10;

  #logger;
  #octoPrintApiService;
  #printersStore;
  #eventEmitter2;

  constructor({ eventEmitter2, printersStore, octoPrintApiService, loggerFactory }) {
    this.#eventEmitter2 = eventEmitter2;
    this.#printersStore = printersStore;
    this.#octoPrintApiService = octoPrintApiService;
    this.#logger = loggerFactory(BedTempOverrideTask.name);
  }

  addBedTempOverride(printerId, bedTemp) {
    if (this.#hasOverride(printerId)) {
      const oldTemp = this.#bedTempOverrides[printerId];

      this.#logger.warning(
        `BedTemp override for printer ${printerId} already exists, overwriting ${oldTemp} with new temp ${bedTemp}`
      );
    }
    this.#bedTempOverrides[printerId] = {
      bedTemp: bedTemp,
      lastOverride: null,
      silencedOverrides: 0,
    };
  }

  removeOverride(printerId) {
    if (!this.#hasOverride(printerId)) {
      this.#logger.warning(
        `Cannot remove BedTemp override for printer ${printerId} as it was not found`
      );
      return;
    }

    delete this.#bedTempOverrides[printerId];
  }

  async #onOctoPrintCurrentEvent(fdmEvent, octoPrintEvent, data) {
    const printerId = fdmEvent.replace("octoprint.", "").replace(".current", "");
    if (!data.type === PEVENTS.current || !data.temps?.length) return;
    await this.#onTemperatureMessage(printerId, octoPrintEvent, data);
  }

  async #onTemperatureMessage(printerId, event, data) {
    const currentTemps = data.temps[0];
    const currentBedTarget = currentTemps.bed.target;
    if (currentBedTarget === 0 || !Object.keys(this.#bedTempOverrides).includes(printerId)) {
      return;
    }

    const bedTempOverride = this.#bedTempOverrides[printerId];
    const desiredTargetBedTemp = bedTempOverride?.bedTemp;
    if (
      !desiredTargetBedTemp ||
      desiredTargetBedTemp > maxBedTemp ||
      desiredTargetBedTemp < minBedTemp
    ) {
      return;
    }

    if (currentBedTarget !== desiredTargetBedTemp) {
      // Debouncing to prevent overloading OctoPrint
      if (
        bedTempOverride.lastOverride &&
        bedTempOverride.lastOverride + this.#minDeltaTimeOverride > Date.now()
      ) {
        bedTempOverride.silencedOverrides += 1;
        if (bedTempOverride.silencedOverrides === 1) {
          this.#logger.info(
            `BedTemp override triggered from ${currentBedTarget} to ${desiredTargetBedTemp} (actual: ${
              currentTemps.bed.actual
            }) within ${
              this.#minDeltaTimeOverride
            } safety time window (ms), will silence this message ${
              this.#resetSilencedOveridesMax
            } times`
          );
        } else if (bedTempOverride.silencedOverrides >= this.#resetSilencedOveridesMax) {
          bedTempOverride.silencedOverrides = 0;
        }
        return;
      }

      this.#logger.info(
        `Overriding BedTemp for printer ${printerId} from ${currentBedTarget} to ${desiredTargetBedTemp} (actual: ${currentTemps.bed?.actual})`
      );
      const printerLogin = this.#printersStore.getPrinterLogin(printerId);
      try {
        await this.#octoPrintApiService.sendBedTempCommand(printerLogin, desiredTargetBedTemp);
      } catch (e) {
        this.#logger.error(
          `Override failed. Will automatically retry in ${this.#minDeltaTimeOverride} ms`
        );
      }
      bedTempOverride.silencedOverrides = 0;
      bedTempOverride.lastOverride = Date.now();
    } else {
      bedTempOverride.silencedOverrides = 0;
    }
  }

  #onPrinterStopped(fdmPrinterEvent) {
    const printerId = fdmPrinterEventToPrinterId(fdmPrinterEvent);
    this.#logger.info(`Removing BedTemp override for printer ${printerId}`);
    this.removeOverride(printerId);
  }

  #hasOverride(printerId) {
    return Object.keys(this.#bedTempOverrides).includes(printerId);
  }

  async run() {
    let that = this;
    this.#eventEmitter2.on(
      octoPrintWebsocketCurrentEvent("*"),
      async function (octoPrintEvent, data) {
        await that.#onOctoPrintCurrentEvent(this.event, octoPrintEvent, data);
      }
    );
    this.#eventEmitter2.on(fdmMonsterPrinterStoppedEvent("*"), async function () {
      await that.#onPrinterStopped(this.event);
    });

    this.#logger.info("BedTemp override task listening for temperature target changes");
  }
}

module.exports = {
  BedTempOverrideTask,
};
