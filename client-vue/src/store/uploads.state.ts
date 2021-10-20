import store from "@/store/index";
import { Action, Module, Mutation, VuexModule } from "vuex-class-modules";
import { QueuedUpload } from "@/models/uploads/queued-upload.model";
import { PrinterFileService } from "@/backend";

@Module
class UploadsModule extends VuexModule {
  queuedUploads: QueuedUpload[] = [];

  get hasPendingUploads() {
    return this.queuedUploads?.length > 0;
  }

  get nextUpload() {
    return this.queuedUploads[0];
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
    if (!this.queuedUploads.length) return;

    const { file, printer, commands } = this.nextUpload;

    // We'd rather fail fast and avoid the same upload failing many times
    this._spliceNextUpload();

    await PrinterFileService.uploadFile(printer.id, file, commands);
  }

  @Action queueUploads(newQueuedUploads: QueuedUpload[]) {
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
