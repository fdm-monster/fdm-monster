class InfluxDbQueryTask {
  influxDbV2BaseService;

  #subscription;

  constructor({ influxDbV2BaseService }) {
    this.influxDbV2BaseService = influxDbV2BaseService;
  }

  async run() {
    if (this.#subscription) {
      this.#subscription.unsubscribe();
    }

    const power$ = await this.influxDbV2BaseService.getPointObservable();
    this.#subscription = power$.subscribe({
      next: (r) => {
        console.log("Message from Influx", r);
      },
      error: (e) => {
        console.error(e);
      },
    });
  }
}

module.exports = {
  InfluxDbQueryTask,
};
