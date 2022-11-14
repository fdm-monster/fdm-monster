<template>
  <v-dialog v-model="dialogOpened" max-width="500" persistent>
    <v-card>
      <v-card-title class="text-h5"> Upload problem occurred</v-card-title>
      <v-layout justify-center>
        <v-icon color="red" size="100">error_outline</v-icon>
      </v-layout>
      <v-card-text>
        Please check: Was the printer connected and printing in OctoPrint? If yes, please reload.
        this page. <br />

        Error type: {{ errorType }}<br />
        Failed uploads:
        <ul>
          <li v-for="(upload, index) in failedUploads" :key="index">
            File: {{ upload.file?.name }}<br />
            Printer: {{ upload.printer?.printerName }}<br />
            Reason: <small>{{ upload?.error }}</small>
          </li>
        </ul>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="red" text @click="dialogOpened = false"> Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { AxiosError } from "axios";
import { uploadFailureMessageEvent, uploadOtherMessageEvent } from "@/event-bus/alert.events";
import { FailedQueuedUpload } from "@/models/uploads/queued-upload.model";
import { usePrintersStore } from "@/store/printers.store";
import { useUploadsStore } from "@/store/uploads.store";

interface Data {
  dialogOpened: boolean;
  errorCode?: number;
  errorType: string;
  failedUploads: FailedQueuedUpload[];
}

export default defineComponent({
  name: "AlertErrorDialog",
  components: {},
  setup: () => {
    return {
      printersStore: usePrintersStore(),
      uploadsStore: useUploadsStore(),
    };
  },
  created() {
    this.$bus.on(uploadFailureMessageEvent, this.uploadFailureHandler);
    this.$bus.on(uploadOtherMessageEvent, this.uploadOtherHandler);
  },
  beforeDestroyed() {
    this.$bus.off(uploadFailureMessageEvent, this.uploadFailureHandler);
    this.$bus.off(uploadOtherMessageEvent, this.uploadOtherHandler);
  },
  async mounted() {},
  props: {},
  data: (): Data => ({
    dialogOpened: false,
    errorCode: undefined,
    failedUploads: [],
    errorType: "",
  }),
  computed: {},
  methods: {
    uploadFailureHandler(e: AxiosError<any>) {
      this.errorType = "Upload error(s)";
      this.errorCode = e.response?.status;
      this.dialogOpened = true;
      this.failedUploads = this.uploadsStore.failedUploads;
    },
    uploadOtherHandler(_e: any) {
      this.errorType = "Unknown error";
      this.errorCode = undefined;
      this.dialogOpened = true;
    },
  },
  watch: {},
});
</script>
