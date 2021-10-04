<template>
  <div v-if="fileList && printerId">
    Files:
    <v-btn color="secondary" @click="getFiles">
      <v-icon>refresh</v-icon>
      Refresh files
    </v-btn>
    <v-list color="primary">
      <v-list-item v-for="file in fileList.files" :key="file.name">
        {{ file.name }} - {{ file.path }} - {{ file.date }}
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
import { OctoPrintService } from "@/backend";

@Component({
  data: () => ({})
})
export default class FileList extends Vue {
  @Prop() fileList;
  @Prop() printerId;

  async getFiles() {
    this.printer.fileList.files = await OctoPrintService.getFiles(this.printerId, false);
  }

  async deleteFile(file) {
    await OctoPrintService.deleteFile(this.printerId, file.path);
  }
}
</script>
