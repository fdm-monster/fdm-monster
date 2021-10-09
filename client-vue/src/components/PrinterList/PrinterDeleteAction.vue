<template>
  <v-btn @click="deletePrinter()">Delete printer</v-btn>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import FileList from "@/components/PrinterList/FileList.vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import { ACTIONS } from "@/store/printers/printers.actions";

@Component({
  components: { FileList }
})
export default class PrinterDeleteAction extends Vue {
  @Prop() printer: Printer;

  get printerId() {
    return this.printer.id;
  }

  async deletePrinter() {
    await this.$store.dispatch(ACTIONS.deletePrinter, this.printerId);
  }
}
</script>
