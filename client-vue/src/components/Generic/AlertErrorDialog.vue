<template>
  <div></div>
</template>
<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import { AxiosError } from "axios";
import { uploadFailureMessageEvent, uploadOtherMessageEvent } from "@/event-bus/alert.events";

@Component({
  data: () => ({})
})
export default class AlertErrorDialog extends Vue {
  created() {
    this.$bus.on(uploadFailureMessageEvent, this.uploadFailureHandler);
    this.$bus.on(uploadOtherMessageEvent, this.uploadOtherHandler);
  }

  beforeDestroyed() {
    this.$bus.off(uploadFailureMessageEvent, this.uploadFailureHandler);
    this.$bus.off(uploadOtherMessageEvent, this.uploadOtherHandler);
  }

  uploadFailureHandler(e: AxiosError<any>) {
    console.log("Errortje");
  }

  uploadOtherHandler(e: any) {
    console.log("Other");
  }
}
</script>
