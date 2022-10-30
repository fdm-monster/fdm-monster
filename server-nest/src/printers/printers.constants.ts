import { HistoryStatisticsModel } from "./models/history-statistics.model";

/**
 * Get an empty history statistics object (inflate to class when methods and meta is required!)
 * @returns {{currentFailed: number, totalPrinterCost: number, highestFilamentUsage: number, completed: number, failed: number, lowestFilamentUsage: number, printerLoad: number, totalFilamentUsage: number, totalSpoolCost: number, highestSpoolCost: number, longestPrintTime: number, printerMost: number, highestPrinterCost: number, shortestPrintTime: number, averageFilamentUsage: number, averagePrintTime: number, cancelled: number, mostPrintedFile: number}}
 */
export function getDefaultHistoryStatistics(): HistoryStatisticsModel {
  return {
    completed: 0,
    cancelled: 0,
    failed: 0,
    longestPrintTime: "0",
    shortestPrintTime: "0",
    averagePrintTime: "0",
    mostPrintedFile: "0",
    printerMost: "0",
    printerLoad: "0",
    totalFilamentUsage: "0",
    averageFilamentUsage: "0",
    highestFilamentUsage: "0",
    lowestFilamentUsage: "0",
    totalSpoolCost: "0",
    highestSpoolCost: "0",
    totalPrinterCost: "0",
    highestPrinterCost: "0",
    currentFailed: 0,

    cancelledPercent: "0",
    failedPercent: "0",
    completedPercent: "0",
    historyByDay: [],
    usageOverTime: [],
    totalByDay: []
  };
}
