<template>
  <div>
    <slot></slot>
    <div v-if="err">
      <v-snackbar v-model="snackbarOpened" absolute bottom right rounded="pill">
        {{ err.message }}

        <template v-slot:action="{ attrs }">
          <v-btn v-bind="attrs" color="error" text @click="snackbarOpened = false"> Close</v-btn>
        </template>
      </v-snackbar>
      <!--      In case of worse troubles -->
      <!--      <v-overlay>-->
      <!--        <v-alert dismissible>An error occurred</v-alert>-->

      <!--        <v-btn @click="cancelError">Cancel</v-btn>-->
      <!--      </v-overlay>-->
    </div>
  </div>
</template>

<script>
import Component from "vue-class-component";
import Vue from "vue";
import { Prop } from "vue-property-decorator";

@Component({
  data: () => ({
    snackbarOpened: false,
    err: false,
    vm: null,
    info: null
  })
})
export default class ErrorAlert extends Vue {
  @Prop(Boolean) stopPropagation;

  errorCaptured(err, vm, info) {
    this.snackbarOpened = true;
    this.err = err;
    this.vm = vm;
    this.info = info;
    return this.stopPropagation;
  }

  cancelError() {
    this.err = false;
  }
}
</script>

<style lang="scss" scoped></style>
