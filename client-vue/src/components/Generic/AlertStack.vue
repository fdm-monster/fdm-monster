<template>
  <div>
    <slot></slot>
    <div v-if="err || info">
      <v-snackbar v-model="snackbarOpened" absolute bottom right rounded="pill">
        <span v-if="err">{{ err.message }}</span>
        {{ info }}

        <template v-slot:action="{ attrs }">
          <v-btn v-bind="attrs" color="error" text @click="snackbarOpened = false"> Close</v-btn>
        </template>
      </v-snackbar>
    </div>
  </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import { infoMessageEvent, vuexErrorEvent } from "@/event-bus/alert.events";

@Component({
  data: () => ({
    err: undefined,
    info: undefined
  })
})
export default class ErrorAlert extends Vue {
  @Prop() stopPropagation: boolean;
  snackbarOpened = false;
  err?: Error;
  vm?: Vue;
  info?: any;

  created() {
    this.$bus.on(vuexErrorEvent, this.storeError);
    this.$bus.on(infoMessageEvent, this.infoMessage);
  }

  beforeDestroyed() {
    this.$bus.off(vuexErrorEvent, this.storeError);
    this.$bus.off(infoMessageEvent, this.infoMessage);
  }

  infoMessage(message: string) {
    this.info = message;
    this.err = undefined;
    this.snackbarOpened = true;
  }

  storeError(event: PromiseRejectionEvent) {
    this.err = event.reason;
    this.snackbarOpened = true;
  }

  errorCaptured(err: Error, vm: Vue, info: any) {
    this.snackbarOpened = true;
    this.err = err;
    this.vm = vm;
    this.info = info;
    return this.stopPropagation;
  }

  cancelError() {
    this.err = undefined;
  }
}
</script>

<style lang="scss" scoped></style>
