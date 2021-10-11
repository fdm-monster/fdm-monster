<template>
  <v-btn @click="deletePrinter()" color="warning" outlined>
    <v-icon>delete</v-icon>
    <span class="d-none d-lg-inline">Delete printer</span>
  </v-btn>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import FileControlList from "@/components/PrinterList/FileControlList.vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import { printersState } from "@/store/printers.state";

@Component({
  components: { FileList: FileControlList }
})
export default class PrinterDeleteAction extends Vue {
  @Prop() printer: Printer;

  get printerId() {
    return this.printer.id;
  }

  async deletePrinter() {
    await printersState.deletePrinter(this.printerId);
  }
}
</script>
