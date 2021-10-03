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
      <v-list-item></v-list-item>
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

  async getFiles() {
    const files = await OctoPrintService.getFiles(this.printer._id, false);
    console.log(files);
  }
}
</script>
