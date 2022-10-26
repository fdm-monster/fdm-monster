class InfluxDbQueryTask {
  influxDbV2BaseService;

  #subscription;
  #lastValues = {};

  constructor({ influxDbV2BaseService }) {
    this.influxDbV2BaseService = influxDbV2BaseService;
  }

  lastCurrentValues() {
    return {
      ...this.#lastValues,
    };
  }

  async run() {
    if (this.#subscription) {
      this.#subscription.unsubscribe();
    }

    const power$ = await this.influxDbV2BaseService.getPointObservable();
    this.#subscription = power$.subscribe({
      next: (r) => {
        const label = r.values[r.tableMeta.column("_field").index];
        const value = r.values[r.tableMeta.column("_value").index];
        const time = r.values[r.tableMeta.column("_time").index];

        this.#lastValues[label] = {
          value,
          time,
        };
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
