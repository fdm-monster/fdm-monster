class InfluxDbQueryTask {
  influxDbV2BaseService;

  #subscription;

  constructor({ influxDbV2BaseService }) {
    this.influxDbV2BaseService = influxDbV2BaseService;
  }

  async run() {
    if (!this.#subscription) {
      const power$ = this.influxDbV2BaseService.getPointObservable();
      this.#subscription = power$.subscribe((r) => {
        console.log("Message from Influx", r);
      });
    }
  }
}

module.exports = {
  InfluxDbQueryTask,
};
