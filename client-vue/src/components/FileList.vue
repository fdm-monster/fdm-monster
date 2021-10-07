<template>
  <div v-if="fileList && printerId">
    Files:
    <v-btn color="secondary" @click="getFiles">
      <v-icon>refresh</v-icon>
      Refresh files
    </v-btn>
    <v-file-input chips counter show-size truncate-length="15"></v-file-input>
    <v-list color="primary">
      <v-list-item v-for="file in fileList.files" :key="file.path">
        {{ file.path }} - {{ file.date }}
        <v-btn @click="deleteFile(file)">
          <v-icon>delete</v-icon>
          Delete
        </v-btn>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
import Component from "vue-class-component";
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import { ACTIONS } from "@/store/printers/printers.actions";

@Component({
  data: () => ({})
})
export default class FileList extends Vue {
  @Prop() fileList;
  @Prop() printerId;

  async getFiles() {
    this.fileList.files = await this.$store.dispatch(ACTIONS.getPrinterFiles, {
      printerId: this.printerId,
      recursive: false
    });
  }

  async deleteFile(file) {
    this.fileList.files = await this.$store.dispatch(ACTIONS.deletePrinterFile, {
      printerId: this.printerId,
      fullPath: file.path
    });
  }
}
</script>
