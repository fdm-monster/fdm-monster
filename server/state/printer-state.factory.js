import DITokens from "../container.tokens";
function PrinterStateFactory(cradle) {
    return {
        async create(printerDocument, isTestPrinter = false) {
            const printerState = cradle[DITokens.printerState];
            // Async just in case setup does async stuff in future
            await printerState.setup(printerDocument, isTestPrinter);
            return printerState;
        }
    };
}
export default PrinterStateFactory;
