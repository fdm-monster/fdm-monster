<template>
  <v-btn class="ma-2" color="primary" @click.c.capture.native.stop="openSettings()" fab small>
    <v-icon>settings</v-icon>
  </v-btn>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import FileControlList from "@/components/PrinterList/FileControlList.vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";

@Component({
  components: { FileList: FileControlList }
})
export default class PrinterSettingsAction extends Vue {
  @Prop() printer: Printer;

  get printerId() {
    return this.printer.id;
  }

  openSettings() {
    this.$emit("update:show", this.printer.id);
  }
}
</script>
