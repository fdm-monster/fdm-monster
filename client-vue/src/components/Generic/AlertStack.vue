<template>
  <div>
    <slot></slot>
    <div v-if="err || info">
      <v-snackbar
        v-model="progressSnackbarOpened"
        absolute
        bottom
        right
        rounded="pill"
      >
        {{ progressInfo }}
        <div v-for="(state, index) in progressStates" :key="index">
          <v-progress-linear v-if="state" :value="100 * state.progress.percent"></v-progress-linear>
        </div>

        <template v-slot:action="{ attrs }">
          <v-btn color="error" text v-bind="attrs" @click="progressSnackbarOpened = false">
            Close
          </v-btn>
        </template>
      </v-snackbar>

      <v-snackbar
        v-if="info || err"
        v-model="infoSnackbarOpened"
        absolute
        bottom
        right
        rounded="pill"
      >
        <span v-if="err">{{ err.message }}</span>
        {{ info }}

        <template v-slot:action="{ attrs }">
          <v-btn color="error" text v-bind="attrs" @click="progressSnackbarOpened = false">
            Close</v-btn
          >
        </template>
      </v-snackbar>
    </div>
  </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import {
  eventTypeToMessage,
  InfoEventType,
  infoMessageEvent,
  uploadMessageEvent,
  vuexErrorEvent
} from "@/event-bus/alert.events";
import { TrackedUpload } from "@/models/sse-messages/printer-sse-message.model";

@Component({
  data: () => ({
    err: undefined,
    progressStates: undefined,
    progressInfo: undefined,
    info: undefined
  })
})
export default class ErrorAlert extends Vue {
  @Prop() stopPropagation: boolean;
  progressSnackbarOpened = false;
  infoSnackbarOpened = false;
  err?: Error;
  progressStates?: TrackedUpload[];
  progressInfo?: any;
  vm?: Vue;
  info?: any;

  created() {
    this.$bus.on(vuexErrorEvent, this.storeError);
    this.$bus.on(infoMessageEvent, this.infoMessage);
    this.$bus.on(uploadMessageEvent, this.uploadTracker);
  }

  beforeDestroyed() {
    this.$bus.off(vuexErrorEvent, this.storeError);
    this.$bus.off(infoMessageEvent, this.infoMessage);
    this.$bus.off(uploadMessageEvent, this.uploadTracker);
  }

  infoMessage(message: string) {
    this.info = message;
    this.infoSnackbarOpened = true;
  }

  uploadTracker(type: InfoEventType, uploadProgress: TrackedUpload[]) {
    this.progressInfo = eventTypeToMessage(type, uploadProgress.length);
    this.progressStates = uploadProgress;
    this.progressSnackbarOpened = true;
  }

  storeError(event: PromiseRejectionEvent) {
    this.err = event.reason;
    this.infoSnackbarOpened = true;
  }

  errorCaptured(err: Error, vm: Vue, info: any) {
    this.infoSnackbarOpened = true;
    this.err = err;
    this.vm = vm;
    this.info = info;
    return this.stopPropagation;
  }

  cancelError() {
    this.err = undefined;
    this.progressStates = undefined;
  }
}
</script>

<style lang="scss" scoped></style>
