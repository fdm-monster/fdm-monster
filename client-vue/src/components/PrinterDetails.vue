<template>
  <div v-if="printer">
    Name: {{ printer.printerName }} <br/>
    URL: {{ printer.printerURL }}

    <FileList :printer-id="printerId" :file-list="printer.fileList" />
  </div>
</template>

<script>
import Component from "vue-class-component";
import Vue from "vue";
import FileList from "@/components/FileList.vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import { PrinterFilesService } from "@/backend";

@Component({
  data: () => ({}),
  components: { FileList }
})
export default class PrinterDetails extends Vue {
  @Prop(Printer) printer;

  get printerId() {
    return this.printer._id;
  }
}
</script>
