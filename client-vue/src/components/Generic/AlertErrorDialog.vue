<template>
  <v-dialog v-model="dialogOpened" persistent max-width="500">
    <v-card>
      <v-card-title class="text-h5">
        Upload problem
        <span v-if="errorCode"> (code: {{ errorCode }})</span>
      </v-card-title>
      <v-layout justify-center>
        <v-icon color="red" size="100">error_outline</v-icon>
      </v-layout>
      <v-card-text>
        Error type: {{ errorType }}<br />
        Failed uploads:
        <ul>
          <li v-for="(upload, index) in failedUploads" :key="index">
            File: {{ upload.file.name }}<br />
            Printer: {{ upload.printer.printerName }}<br />
            Reason: <small>{{ upload.error }}</small>
          </li>
        </ul>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="red" text @click="dialogOpened = false"> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import { AxiosError } from "axios";
import { uploadFailureMessageEvent, uploadOtherMessageEvent } from "@/event-bus/alert.events";
import { FailedQueuedUpload } from "@/models/uploads/queued-upload.model";
import { uploadsState } from "@/store/uploads.state";

@Component({
  data: () => ({
    dialogOpened: false,
    errorCode: undefined,
    failedUploads: [],
    errorType: ""
  })
})
export default class AlertErrorDialog extends Vue {
  dialogOpened: boolean;
  errorCode?: number;
  errorType: string = "Upload error(s)";

  failedUploads: FailedQueuedUpload[];

  created() {
    this.$bus.on(uploadFailureMessageEvent, this.uploadFailureHandler);
    this.$bus.on(uploadOtherMessageEvent, this.uploadOtherHandler);
  }

  beforeDestroyed() {
    this.$bus.off(uploadFailureMessageEvent, this.uploadFailureHandler);
    this.$bus.off(uploadOtherMessageEvent, this.uploadOtherHandler);
  }

  uploadFailureHandler(e: AxiosError<any>) {
    this.errorType = "Upload error(s)";
    this.errorCode = e.response?.status;
    this.dialogOpened = true;
    this.failedUploads = uploadsState.failedUploads;
  }

  uploadOtherHandler(e: any) {
    this.errorType = "Unknown error";
    this.errorCode = undefined;
    this.dialogOpened = true;
  }
}
</script>
