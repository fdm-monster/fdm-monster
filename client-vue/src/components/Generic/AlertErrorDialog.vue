<template>
  <v-dialog v-model="dialogOpened" persistent max-width="500">
    <template v-slot:activator="{ on, attrs }">
      <v-btn color="primary" dark v-bind="attrs" v-on="on"> Open Dialog </v-btn>
    </template>
    <v-card>
      <v-card-title class="text-h5">
        Upload problem
        <span v-if="errorCode">(code: {{ errorCode }})</span>
      </v-card-title>
      <v-layout justify-center>
        <v-icon class="red darken-1" size="100">error_outline</v-icon>
      </v-layout>
      <v-card-text> Error parsing here </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="red darken-1" text @click="dialogOpened = false"> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import { AxiosError } from "axios";
import { uploadFailureMessageEvent, uploadOtherMessageEvent } from "@/event-bus/alert.events";

@Component({
  data: () => ({
    dialogOpened: false,
    errorCode: undefined
  })
})
export default class AlertErrorDialog extends Vue {
  dialogOpened: boolean;
  errorCode?: number;

  created() {
    this.$bus.on(uploadFailureMessageEvent, this.uploadFailureHandler);
    this.$bus.on(uploadOtherMessageEvent, this.uploadOtherHandler);
  }

  beforeDestroyed() {
    this.$bus.off(uploadFailureMessageEvent, this.uploadFailureHandler);
    this.$bus.off(uploadOtherMessageEvent, this.uploadOtherHandler);
  }

  uploadFailureHandler(e: AxiosError<any>) {
    this.errorCode = e.response?.status;
    console.log("Errortje");
  }

  uploadOtherHandler(e: any) {
    this.errorCode = undefined;
    console.log("Other");
  }
}
</script>
