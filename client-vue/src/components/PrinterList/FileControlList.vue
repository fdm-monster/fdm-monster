<template>
  <div v-if="fileList && printerId">
    Files:
    <v-btn color="secondary" @click="getFiles">
      <v-icon>refresh</v-icon>
      Refresh files
    </v-btn>
    <!--    <v-file-input chips counter show-size truncate-length="15" clearable></v-file-input>-->
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
import { FileList } from "@/models/printers/file-list.model";
import { printersState } from "@/store/printers.state";

@Component({
  data: () => ({})
})
export default class FileControlList extends Vue {
  @Prop() fileList: FileList;
  @Prop() printerId: string;

  async getFiles() {
    this.fileList.files = await printersState.loadPrinterFiles({
      printerId: this.printerId,
      recursive: false
    });
  }

  async deleteFile(file: PrinterFile) {
    this.fileList.files = await printersState.deletePrinterFile({
      printerId: this.printerId,
      fullPath: file.path
    });
  }
}
</script>
