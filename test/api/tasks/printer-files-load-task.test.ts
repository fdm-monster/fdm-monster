import { setupTestApp } from "../../test-server";
import { DITokens } from "@/container.tokens";
import { AwilixContainer } from "awilix";
import { PrinterFilesLoadTask } from "@/tasks/printer-files-load.task";
import { PrinterFilesStore } from "@/state/printer-files.store";

let container: AwilixContainer;
let task: PrinterFilesLoadTask;
let printerFilesStore: PrinterFilesStore;

beforeAll(async () => {
  ({ container } = await setupTestApp(false));
  task = container.resolve(DITokens.printerFilesLoadTask);
  printerFilesStore = container.resolve(DITokens.printerFilesStore);
});

describe(PrinterFilesLoadTask.name, () => {
  it("should run task without errors", async () => {
    // Mock the loadFilesStore method to avoid actual network calls
    const loadFilesStoreSpy = jest.spyOn(printerFilesStore, 'loadFilesStore').mockResolvedValue();

    await expect(task.run()).resolves.not.toThrow();

    expect(loadFilesStoreSpy).toHaveBeenCalledTimes(1);

    // Clean up mock
    loadFilesStoreSpy.mockRestore();
  });

  it("should handle errors gracefully when loadFilesStore fails", async () => {
    const mockError = new Error("Network connection failed");
    const loadFilesStoreSpy = jest.spyOn(printerFilesStore, 'loadFilesStore').mockRejectedValue(mockError);
    const loggerSpy = jest.spyOn(task.logger, 'error').mockImplementation();

    // Should not throw, but should log the error
    await expect(task.run()).resolves.not.toThrow();

    expect(loadFilesStoreSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith("Failed to load files store in background", mockError);

    // Clean up mocks
    loadFilesStoreSpy.mockRestore();
    loggerSpy.mockRestore();
  });

  it("should log success message when files store loads successfully", async () => {
    const loadFilesStoreSpy = jest.spyOn(printerFilesStore, 'loadFilesStore').mockResolvedValue();
    const loggerSpy = jest.spyOn(task.logger, 'log').mockImplementation();

    await task.run();

    expect(loggerSpy).toHaveBeenCalledWith("Loading files store in background");
    expect(loggerSpy).toHaveBeenCalledWith("Files store loaded successfully in background");

    // Clean up mocks
    loadFilesStoreSpy.mockRestore();
    loggerSpy.mockRestore();
  });
});
