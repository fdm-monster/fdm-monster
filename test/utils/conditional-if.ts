import ProvidesCallback = jest.ProvidesCallback;

export const testIf = (condition: boolean, name: string, fn?: ProvidesCallback, timeout?: number) =>
  condition ? test(name, fn, timeout) : test.skip(name, fn, timeout);
