const { bench } = require("../../utils/benchmark.util");
const { sleep } = require("../../utils/time.utils");
const { sizeKB } = require("../../utils/metric.utils");

describe("BenchUtil", () => {
  const cb = async () => {
    await sleep();
    return true;
  };
  const errorCb = async () => {
    throw new Error("asd");
  };

  it("measures time", async () => {
    const report = await bench(cb, true);
    expect(report).toMatchObject({
      result: true,
      time: expect.any(Number)
    });
    expect(report.time).toBeGreaterThan(0);
  });

  it("measures time with error", async () => {
    const report = await bench(errorCb, true);
    expect(report).toMatchObject({
      result: undefined,
      time: expect.any(Number)
    });
  });

  it("measures time without report", async () => {
    const report = await bench(cb, false);
    expect(report).toEqual(true);
  });

  it("bytecount should work", () => {
    const length = sizeKB("asd");
    expect(length).not.toBe(0);
  });
});
