<template>
  <div>
    <slot></slot>
    <div>
      <v-snackbar
        v-model="progressSnackbarOpened"
        absolute
        bottom
        right
        rounded="rounded"
        timeout="-1"
      >
        {{ progressInfo }}
        <div v-for="(state, index) in progressStates" :key="index" class="mb-2">
          {{ getUploadingFileName(state) }}
          <v-progress-linear v-if="state" :value="100 * state.progress.percent"></v-progress-linear>
        </div>

        <template v-slot:action="{ attrs }">
          <v-btn color="success" text v-bind="attrs" @click="progressSnackbarOpened = false">
            Close
          </v-btn>
        </template>
      </v-snackbar>

      <v-snackbar
        v-if="info || err"
        v-model="infoSnackbarOpened"
        absolute
        bottom
        class="mb-16"
        right
        rounded="pill"
      >
        <span v-if="err">{{ err.message }}</span>
        {{ info }}

        <template v-slot:action="{ attrs }">
          <v-btn
            :color="err ? 'error' : 'success'"
            text
            v-bind="attrs"
            @click="infoSnackbarOpened = false"
          >
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </div>
    <AlertErrorDialog />
  </div>
</template>

<script lang="ts">
import Vue, { defineComponent } from "vue";
import {
  eventTypeToMessage,
  InfoEventType,
  infoMessageEvent,
  uploadMessageEvent,
  errorEvent,
} from "@/event-bus/alert.events";
import { TrackedUpload, UploadStates } from "@/models/sse-messages/printer-sse-message.model";
import AlertErrorDialog from "@/components/Generic/AlertErrorDialog.vue";
import { useUploadsStore } from "@/store/uploads.store";

interface Data {
  progressSnackbarOpened: boolean;
  infoSnackbarOpened: boolean;
  err?: Error;
  progressStates?: TrackedUpload[];
  progressInfo?: any;
  info?: any;
  vm?: any; // hard to type
}

export default defineComponent({
  name: "AlertStack",
  components: {
    AlertErrorDialog,
  },
  setup: () => {
    return {
      uploadsStore: useUploadsStore(),
    };
  },
  created() {
    this.$bus.on(errorEvent, this.storeError);
    this.$bus.on(infoMessageEvent, this.infoMessage);
    this.$bus.on(uploadMessageEvent, this.uploadTracker);
  },
  async mounted() {},
  props: {
    stopPropagation: Boolean,
  },
  data: (): Data => ({
    progressSnackbarOpened: false,
    infoSnackbarOpened: false,
    err: undefined,
    progressStates: undefined,
    progressInfo: undefined,
    info: undefined,
    vm: undefined,
  }),
  computed: {},
  beforeDestroyed() {
    this.$bus.off(errorEvent, this.storeError);
    this.$bus.off(infoMessageEvent, this.infoMessage);
    this.$bus.off(uploadMessageEvent, this.uploadTracker);
  },
  methods: {
    getUploadingFileName(state: TrackedUpload) {
      if (!state.multerFile?.length) return "";
      return state.multerFile[0].originalname;
    },
    infoMessage(message: string) {
      this.info = message;
      this.infoSnackbarOpened = true;
    },
    uploadTracker(type: InfoEventType, uploadProgress: UploadStates) {
      if (
        !uploadProgress.current?.length &&
        !this.uploadsStore.hasPendingUploads &&
        !this.uploadsStore.isUploadingNow
      ) {
        this.progressSnackbarOpened = false;
        return;
      }
      this.progressInfo = eventTypeToMessage(type, uploadProgress.current?.length);
      this.progressStates = uploadProgress.current;
      this.progressSnackbarOpened = true;
    },
    storeError(event: PromiseRejectionEvent) {
      this.err = event.reason;
      this.infoSnackbarOpened = true;
    },
    errorCaptured(err: Error, vm: Vue, info: any) {
      this.infoSnackbarOpened = true;
      this.err = err;
      this.vm = vm;
      this.info = info;
      return this.stopPropagation;
    },
    cancelError() {
      this.err = undefined;
      this.progressStates = undefined;
    },
  },
  watch: {},
});
</script>

<style lang="scss" scoped></style>
