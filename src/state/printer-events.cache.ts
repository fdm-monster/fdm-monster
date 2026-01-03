import { KeyDiffCache } from "@/utils/cache/key-diff.cache";
import { printerEvents, PrintersDeletedEvent } from "@/constants/event.constants";
import EventEmitter2 from "eventemitter2";
import { OctoPrintEventDto, WsMessage, messages } from "@/services/octoprint/dto/octoprint-event.dto";
import { MoonrakerEventDto, MR_WsMessage } from "@/services/moonraker/constants/moonraker-event.dto";
import { PrinterObjectsQueryDto } from "@/services/moonraker/dto/objects/printer-objects-query.dto";
import { SubscriptionType } from "@/services/moonraker/moonraker-websocket.adapter";
import { octoPrintEvent } from "@/services/octoprint/octoprint-websocket.adapter";
import { moonrakerEvent } from "@/services/moonraker/constants/moonraker.constants";
import { prusaLinkEvent } from "@/services/prusa-link/constants/prusalink.constants";
import { PrusaLinkEventDto } from "@/services/prusa-link/constants/prusalink-event.dto";
import { bambuEvent, BambuEventDto } from "@/services/bambu/bambu-mqtt.adapter";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { PrintJobService } from "@/services/orm/print-job.service";
import { PrinterCache } from "@/state/printer.cache";
import { PrinterThumbnailCache } from "@/state/printer-thumbnail.cache";

export type WsMessageWithoutEventAndPlugin = Exclude<WsMessage, "event" | "plugin">;
export type PrinterEventsCacheDto = Record<WsMessageWithoutEventAndPlugin, any>;

export class PrinterEventsCache extends KeyDiffCache<PrinterEventsCacheDto> {
  private readonly logger: LoggerService;

  constructor(
    private readonly eventEmitter2: EventEmitter2,
    loggerFactory: ILoggerFactory,
    private readonly printJobService: PrintJobService,
    private readonly printerCache: PrinterCache,
    private readonly printerThumbnailCache: PrinterThumbnailCache,
  ) {
    super();

    this.logger = loggerFactory(PrinterEventsCache.name);
    this.subscribeToEvents();
  }

  async deletePrinterSocketEvents(id: number) {
    await this.deleteKeyValue(id, true);
  }

  async getPrinterSocketEvents(id: number) {
    return this.keyValueStore.get(id);
  }

  async getOrCreateEvents(printerId: number) {
    let ref = await this.getValue(printerId);
    if (!ref) {
      ref = {
        connected: null,
        reauthRequired: null,
        // slicingProgress: null,
        notify_status_update: null,
        current: null,
        history: null,
        // timelapse: null,
        // event: {},
        // plugin: {},
        API_STATE_UPDATED: null,
        WS_CLOSED: null,
        WS_ERROR: null,
        WS_OPENED: null,
        WS_STATE_UPDATED: null,
      };
      await this.setKeyValue(printerId, ref);
    }
    return ref;
  }

  async setEvent(printerId: number, label: WsMessageWithoutEventAndPlugin, payload: any) {
    const ref = await this.getOrCreateEvents(printerId);
    ref[label] = {
      payload,
      receivedAt: Date.now(),
    };
    await this.setKeyValue(printerId, ref);
  }

  async setSubState(printerId: number, label: WsMessageWithoutEventAndPlugin, substateName: string, payload: any) {
    const ref = await this.getOrCreateEvents(printerId);
    if (!ref[label]) {
      ref[label] = {};
    }
    ref[label][substateName] = {
      payload,
      receivedAt: Date.now(),
    };
    await this.setKeyValue(printerId, ref);
  }

  private async handlePrintersDeleted(event: PrintersDeletedEvent) {
    await this.deleteKeysBatch(event.printerIds);
  }

  private subscribeToEvents() {
    this.eventEmitter2.on(octoPrintEvent("*"), (e) => this.onOctoPrintSocketMessage(e));
    this.eventEmitter2.on(moonrakerEvent("*"), (e) => this.onMoonrakerSocketMessage(e));
    this.eventEmitter2.on(prusaLinkEvent("*"), (e) => this.onPrusaLinkPollMessage(e));
    this.eventEmitter2.on(bambuEvent("*"), (e) => this.onBambuSocketMessage(e));
    this.eventEmitter2.on(printerEvents.printersDeleted, this.handlePrintersDeleted.bind(this));
  }

  private async getPrinterName(printerId: number): Promise<string | undefined> {
    try {
      const printer = await this.printerCache.getValue(printerId);
      return printer?.name;
    } catch (error) {
      this.logger.debug(`Could not get printer name for ${printerId}: ${error}`);
      return undefined;
    }
  }

  private async onOctoPrintSocketMessage(e: OctoPrintEventDto) {
    const printerId = e.printerId as number;
    if (e.event === messages.current && e.payload) {
      await this.setEvent(printerId, messages.current, e.payload);
      const payload = e.payload as any;
      const flags = payload?.state?.flags;
      const filePath = payload?.job?.file?.path;
      const completion = payload?.progress?.completion;

      if (flags?.printing && filePath) {
        // Ensure a job exists and set STARTED
        const printerName = await this.getPrinterName(printerId);
        const job = await this.printJobService.markStarted(printerId, filePath, printerName);

        // Update printer thumbnail from this job
        if (job) {
          await this.printerThumbnailCache.handleJobStarted(printerId, job.id);
        }

        // Trigger file download and analysis if we don't have the file locally
        if (job && !job.fileStorageId && job.analysisState === "NOT_ANALYZED") {
          this.logger.log(`Job ${job.id} has no local file - triggering download and analysis`);
          await this.printJobService.triggerFileAnalysis(job.id);
        }

        // Update metadata from OctoPrint job data if available (as fallback)
        if (job && !job.metadata?.gcodePrintTimeSeconds) {
          const estimatedTime = payload?.job?.estimatedPrintTime;
          const filament = payload?.job?.filament?.tool0;

          await this.printJobService.updateJobMetadata(printerId, filePath, {
            gcodePrintTimeSeconds: estimatedTime ? Math.round(estimatedTime) : null,
            nozzleDiameterMm: null, // Not in websocket data
            filamentDiameterMm: null,
            filamentDensityGramsCm3: null,
            filamentUsedMm: filament?.length ? Math.round(filament.length) : null,
            filamentUsedCm3: filament?.volume ? Math.round(filament.volume * 100) / 100 : null,
            filamentUsedGrams: null,
            totalFilamentUsedGrams: null,
          });
        }
      }
      if (typeof completion === "number" && filePath) {
        await this.printJobService.markProgress(printerId, filePath, completion);
      }
      if ((flags?.finished || flags?.error) && filePath) {
        const reason = flags?.error ? "Error" : "Finished";
        if (flags?.finished) {
          const job = await this.printJobService.markFinished(printerId, filePath);
          // Update printer thumbnail from completed job
          if (job) {
            await this.printerThumbnailCache.handleJobCompleted(printerId, job.id);
          }
        } else {
          await this.printJobService.markFailed(printerId, filePath, reason);
        }
      }
    }
  }

  private async onMoonrakerSocketMessage(
    e: MoonrakerEventDto<MR_WsMessage, PrinterObjectsQueryDto<SubscriptionType | null>>,
  ) {
    const printerId = e.printerId;
    const eventType = e.event;
    // https://github.com/mainsail-crew/mainsail/blob/fa61d4ef92 97426a404dd845a1a4d5e4525c43dc/src/components/panels/StatusPanel.vue#L199
    if ([messages.notify_status_update, messages.current].includes(eventType as any)) {
      await this.setEvent(printerId, eventType as "notify_status_update" | "current", e.payload);
      const payload = e.payload as any;
      const status = payload?.status ?? payload?.result ?? {};
      const filename = status?.print_stats?.filename;
      const progress = status?.display_status?.progress ?? status?.print_stats?.progress;
      const state = status?.print_stats?.state;
      if (state === "printing" && filename) {
        const printerName = await this.getPrinterName(printerId);
        const job = await this.printJobService.markStarted(printerId, filename, printerName);

        // Update printer thumbnail from this job
        if (job) {
          await this.printerThumbnailCache.handleJobStarted(printerId, job.id);
        }

        // Trigger file download and analysis if needed
        if (job && !job.fileStorageId && job.analysisState === "NOT_ANALYZED") {
          this.logger.log(`Job ${job.id} has no local file - triggering download and analysis`);
          await this.printJobService.triggerFileAnalysis(job.id);
        }
      }
      if (typeof progress === "number" && filename) {
        await this.printJobService.markProgress(printerId, filename, Math.round(progress * 100));
      }
      if (["complete", "cancelled", "error"].includes(state) && filename) {
        if (state === "complete") {
          const job = await this.printJobService.markFinished(printerId, filename);
          // Update printer thumbnail from completed job
          if (job) {
            await this.printerThumbnailCache.handleJobCompleted(printerId, job.id);
          }
        } else {
          await this.printJobService.markFailed(printerId, filename, state);
        }
      }
    }
  }

  private async onPrusaLinkPollMessage(e: PrusaLinkEventDto) {
    const printerId = e.printerId;
    if (e.event === messages.current) {
      await this.setEvent(printerId, messages.current, e.payload);
      const payload = e.payload as any;
      const state = payload?.state;
      const filename = payload?.job?.file?.path ?? payload?.job?.file?.display;
      const completion = payload?.progress?.completion;
      if (state === "Printing" && filename) {
        const printerName = await this.getPrinterName(printerId);
        const job = await this.printJobService.markStarted(printerId, filename, printerName);

        // Update printer thumbnail from this job
        if (job) {
          await this.printerThumbnailCache.handleJobStarted(printerId, job.id);
        }

        // Trigger file download and analysis if needed
        if (job && !job.fileStorageId && job.analysisState === "NOT_ANALYZED") {
          this.logger.log(`Job ${job.id} has no local file - triggering download and analysis`);
          await this.printJobService.triggerFileAnalysis(job.id);
        }
      }
      if (typeof completion === "number" && filename) {
        await this.printJobService.markProgress(printerId, filename, completion);
      }
      // PrusaLink states: "Printing", "Finished", "Stopped", "Error", "Operational", "Ready"
      if (state === "Finished" && filename) {
        const job = await this.printJobService.markFinished(printerId, filename);
        // Update printer thumbnail from completed job
        if (job) {
          await this.printerThumbnailCache.handleJobCompleted(printerId, job.id);
        }
      } else if (["Stopped", "Error"].includes(state) && filename) {
        await this.printJobService.markFailed(printerId, filename, state);
      }
    }
  }

  private async onBambuSocketMessage(e: BambuEventDto) {
    const printerId = e.printerId;
    if (!printerId) {
      this.logger.warn("Received Bambu event without printerId", e);
      return;
    }

    if (e.event === messages.current) {
      await this.setEvent(printerId, messages.current, e.payload);
      const payload = e.payload as any;
      const print = payload?.print;
      const percent = print?.mc_percent;
      const filename = print?.gcode_file || print?.subtask_name;
      const stage = print?.mc_print_stage;
      const state = print?.gcode_state;

      if (state === "PRINTING" && filename) {
        const printerName = await this.getPrinterName(printerId);
        const job = await this.printJobService.markStarted(printerId, filename, printerName);

        // Update printer thumbnail from this job
        if (job) {
          await this.printerThumbnailCache.handleJobStarted(printerId, job.id);
        }

        // Trigger file download and analysis if needed
        if (job && !job.fileStorageId && job.analysisState === "NOT_ANALYZED") {
          this.logger.log(`Job ${job.id} has no local file - triggering download and analysis`);
          await this.printJobService.triggerFileAnalysis(job.id);
        }

        // Update metadata from Bambu MQTT data if job was just created and has no metadata (as fallback)
        if (job && !job.metadata?.gcodePrintTimeSeconds) {
          const remainingMinutes = print?.mc_remaining_time;
          const totalLayers = print?.total_layer_num;
          // mc_remaining_time is in minutes, convert to seconds
          const estimatedSeconds = remainingMinutes ? remainingMinutes * 60 : null;

          // Try to get filament diameter from AMS tray data
          const tray = print?.ams?.tray_now ? print?.vt_tray : print?.ams?.ams?.[0]?.tray?.[0];
          const filamentDiameter = tray?.tray_diameter ? parseFloat(tray.tray_diameter) : null;

          await this.printJobService.updateJobMetadata(printerId, filename, {
            gcodePrintTimeSeconds: estimatedSeconds,
            nozzleDiameterMm: null, // Not available in MQTT
            filamentDiameterMm: filamentDiameter,
            filamentDensityGramsCm3: null,
            filamentUsedMm: null,
            filamentUsedCm3: null,
            filamentUsedGrams: null,
            totalFilamentUsedGrams: null,
          });
        }
      }
      if (typeof percent === "number" && filename) {
        await this.printJobService.markProgress(printerId, filename, percent);
      }
      if (state === "FINISHED" && filename) {
        const job = await this.printJobService.markFinished(printerId, filename);
        // Update printer thumbnail from completed job
        if (job) {
          await this.printerThumbnailCache.handleJobCompleted(printerId, job.id);
        }
      } else if (state === "IDLE") {
        // Bambu printers go to IDLE when print is cancelled/stopped (they don't send "CANCELLED" state)
        // Check if there's an active print job - if so, it was cancelled
        const activeJob = await this.printJobService.getActivePrintJob(printerId);
        if (activeJob && activeJob.status === "PRINTING") {
          this.logger.log(`Print job ${activeJob.id} transitioned to IDLE - marking as cancelled`);
          await this.printJobService.handlePrintCancelled(printerId, "Print stopped");
        }
      } else if (state === "ERROR" && filename) {
        await this.printJobService.markFailed(printerId, filename, "Error");
      }
    }
  }
}
