export const sseMessageGlobal = "sse-message-global";
export const sseTestPrinterUpdate = (correlationToken: string) =>
  `sse-message-test-printer-${correlationToken}`;
