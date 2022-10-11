<template>
  <div v-if="fileList && printerId">
    <strong>Files:</strong>
    <v-list color="primary">
      <v-list-item v-for="file in fileList.files" :key="file.path">
        {{ file.path }} - {{ file.date }}
        <v-btn @click="deleteFile(file)">
          <v-icon>delete</v-icon>
          <v-spacer></v-spacer>
          Delete
        </v-btn>
      </v-list-item>
    </v-list>
  </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import { PrinterFile } from "@/models/printers/printer-file.model";
import { PrinterFileCache } from "@/models/printers/printer-file-cache.model";
import { printersState } from "@/store/printers.state";

@Component({
  data: () => ({}),
})
export default class FileControlList extends Vue {
  @Prop() fileList: PrinterFileCache;
  @Prop() printerId: string;

  async deleteFile(file: PrinterFile) {
    this.fileList.files = await printersState.deletePrinterFile({
      printerId: this.printerId,
      fullPath: file.path,
    });
  }
}
</script>
