import Noty from "noty";

/**
 * Noty alert container to keep track of active alerts
 */
export class NotyAlertsService {
  #alerts = [];

  constructor() {
    this.#alerts = [];
  }

  hideAlerts() {
    // Unused but might be useful
    for (let alert in this.#alerts) {
      alert.close();
    }

    this.#alerts = [];
  }

  closeAlert(alert) {
    const index = this.#alerts.findIndex((a) => a === alert);
    if (index > -1) {
      this.#alerts.splice(index, 1);
    }

    alert.close();
  }

  showInfo({ message, delay }) {
    return this.#showNoty({ message, delay, type: "info" });
  }

  showSuccess({ message, delay }) {
    return this.#showNoty({ message, delay, type: "success" });
  }

  #showNoty({ message, type = "info", delay = 3000, click = "Clicked" }) {
    let alert = new Noty({
      type: "info",
      theme: "bootstrap-v4",
      closeWith: click,
      timeout: delay,
      layout: "bottomRight",
      text: message
    });

    this.#alerts.push(alert);
    alert.show();
    return alert;
  }
}
