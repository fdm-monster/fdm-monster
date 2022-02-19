const MEASUREMENT_NAME = "PrintersInformation";
class InfluxDbPrinterStateService {
    #influxDbSetupService;
    constructor({ influxDbSetupService }) {
        this.#influxDbSetupService = influxDbSetupService;
    }
}
export default InfluxDbPrinterStateService;
