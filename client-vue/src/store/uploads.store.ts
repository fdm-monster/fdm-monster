import { defineStore } from "pinia";
import { VueBus } from "vue-bus";
import { FailedQueuedUpload, QueuedUpload } from "@/models/uploads/queued-upload.model";
import { PrinterFileService } from "@/backend";
import { uploadFailureMessageEvent, uploadOtherMessageEvent } from "@/event-bus/alert.events";

export interface UploadsState {
  $bus?: VueBus;
  queuedUploads: QueuedUpload[];
  failedUploads: FailedQueuedUpload[];
  uploadingNow: boolean;
}

export const useUploadsStore = defineStore("Uploads", {
  state: (): UploadsState => ({
    $bus: undefined,
    queuedUploads: [],
    failedUploads: [],
    uploadingNow: false,
  }),
  getters: {
    hasPendingUploads(state) {
      return state.queuedUploads?.length > 0;
    },
    isUploadingNow(state) {
      return state.uploadingNow;
    },
    nextUpload(state) {
      return state.queuedUploads[0];
    },
  },
  actions: {
    queueUploads(uploads: QueuedUpload[]) {
      this.failedUploads = [];
      this.queuedUploads.push(...uploads);
    },
    cancelUploads() {
      this.queuedUploads = [];
      this.failedUploads = [];
    },
    _injectEventBus(eventBus: VueBus) {
      this.$bus = eventBus;
    },
    _setUploadingNow(uploading: boolean) {
      this.uploadingNow = uploading;
    },
    _appendFailedUpload(failedUpload: FailedQueuedUpload) {
      this.failedUploads.push(failedUpload);
    },
    _spliceNextUpload() {
      this.queuedUploads.splice(0, 1);
    },
    async handleNextUpload() {
      // Dont upload when queue empty
      if (!this.queuedUploads?.length) return;
      this._setUploadingNow(true);
      const { file, printer, commands } = this.nextUpload;
      // We'd rather fail fast and avoid the same upload failing many times
      this._spliceNextUpload();

      try {
        await PrinterFileService.uploadFile(printer, file, commands);
      } catch (e: any) {
        if (e.isAxiosError) {
          console.log("Axios error caught and emitted to bus");
          const failedUpload: FailedQueuedUpload = {
            file,
            printer,
            commands,
            error: e,
          };
          this._appendFailedUpload(failedUpload);
          this.$bus!.emit(uploadFailureMessageEvent, e);
        } else {
          this.$bus!.emit(uploadOtherMessageEvent, e);
        }
      }
      this._setUploadingNow(false);
    },
  },
});
