import { LoggerService } from "../handlers/logger.js";

const logger = new LoggerService("Benchmark");

/**
 * Timing benchmark function, DO NOT USE IN PRODUCTION - just use it once and remove after.
 * For real benchmarking look for profiling or clinic doctor/flame
 * @param cb
 * @param report
 * @returns {Promise<*|{result: *, time: number}>}
 */
export async function bench(cb, report = false) {
  const beforeTime = Date.now();
  let result;
  try {
    result = await cb();
  } catch (e) {
    logger.error(e);
  }
  const afterTime = Date.now();

  if (!!report) {
    return {
      result,
      time: afterTime - beforeTime,
    };
  } else return result;
}

export function noop() {}
