<template>
  <div v-if="printer">
    More info about
    {{
      JSON.stringify({
        _id: printer._id,
        name: printer.printerName,
        printerURL: printer.printerURL
      })
    }}
    <br />
    Files:
    <v-btn @click="getFiles">Refresh</v-btn>
    <v-list>
      <v-list-item v-for="file in printer.fileList.files" :key="file.name">
        {{ file.name }} - {{ file.path }} - {{ file.date }}
        <v-btn @click="deleteFile(file)">Delete</v-btn>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
import Component from "vue-class-component";
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import { OctoPrintService } from "@/backend";

@Component({
  data: () => ({})
})
export default class PrinterDetails extends Vue {
  @Prop(Printer) printer;

  get printerId() {
    return this.printer._id;
  }

  async getFiles() {
    this.printer.fileList.files = await OctoPrintService.getFiles(this.printerId, false);
  }

  async deleteFile(file) {
    await OctoPrintService.deleteFile(this.printerId, file.path);
  }
}
</script>
