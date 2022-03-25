import store from "@/store/index";
import { Action, Module, Mutation, VuexModule } from "vuex-class-modules";
import { QueuedUpload } from "@/models/uploads/queued-upload.model";
import { PrinterFileService } from "@/backend";
import { VueBus } from "vue-bus";
import { uploadFailureMessageEvent, uploadOtherMessageEvent } from "@/event-bus/alert.events";

@Module
class UploadsModule extends VuexModule {
  $bus: VueBus;
  queuedUploads: QueuedUpload[] = [];
  uploadingNow = false;

  get hasPendingUploads() {
    return this.queuedUploads?.length > 0;
  }

  get isUploadingNow() {
    return this.uploadingNow;
  }

  get nextUpload() {
    return this.queuedUploads[0];
  }

  @Mutation _injectEventBus(eventBus: VueBus) {
    this.$bus = eventBus;
  }

  @Mutation _setUploadingNow(uploading: boolean) {
    this.uploadingNow = uploading;
  }

  @Mutation _setUploads(uploads: QueuedUpload[]) {
    this.queuedUploads = uploads;
  }

  @Mutation _spliceNextUpload() {
    this.queuedUploads.splice(0, 1);
  }

  @Mutation _resetUploads() {
    this.queuedUploads = [];
  }

  @Action
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
        console.log("Axio error caught");
        this.$bus.emit(uploadFailureMessageEvent, e);
      } else {
        this.$bus.emit(uploadOtherMessageEvent, e);
      }
    }

    this._setUploadingNow(false);
  }

  @Action queueUploads(newQueuedUploads: QueuedUpload[]) {
    // TODO implement this ability and check if file was already uploaded or already printing
    if (this.queuedUploads?.length > 0) return;

    this._setUploads(newQueuedUploads);
  }

  @Action cancelUploads() {
    this._resetUploads();
  }
}

export const uploadsState = new UploadsModule({
  store,
  name: "uploads"
});
