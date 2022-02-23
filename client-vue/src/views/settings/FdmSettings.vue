<template>
  <v-card>
    <v-toolbar color="primary">
      <v-avatar>
        <v-icon>settings</v-icon>
      </v-avatar>
      <v-toolbar-title>FDM Monster Settings</v-toolbar-title>
    </v-toolbar>
    <v-list subheader three-line>
      <v-subheader>Files and GCode</v-subheader>

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Pre-upload file cleanup</v-list-item-title>
          <v-list-item-subtitle>
            Automatically cleanup old files to ensure the SD card has enough space.
            <br />
            <v-checkbox
              v-model="fileHandlingSettings.autoRemoveOldFilesBeforeUpload"
              label="Remove old file before upload"
            ></v-checkbox>
            <v-checkbox
              v-model="fileHandlingSettings.autoRemoveOldFilesAtBoot"
              label="Remove old files when (re)booting the server"
            ></v-checkbox>
            <v-text-field
              v-model="fileHandlingSettings.autoRemoveOldFilesCriteriumDays"
              :disabled="!fileHandlingSettings.autoRemoveOldFilesBeforeUpload"
              min="0"
              outlined
              type="number"
            />
            <v-btn @click="setFileHandlingClientSettings">save</v-btn>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Clean file references</v-list-item-title>
          <v-list-item-subtitle>
            Clear out the file references for all printers - this does not remove them from
            OctoPrint!
            <br />
            <v-btn color="primary" @click="purgeFiles()">Purge file references</v-btn>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Disable inefficient GCode analysis</v-list-item-title>
          <v-list-item-subtitle>
            Disable GCode analysis on all printers at once, preventing CPU intensive and inaccurate
            time/size estimates.
            <br />
            <v-btn color="primary" @click="bulkDisableGCodeAnalysis()"
              >Bulk disable GCode Analysis
            </v-btn>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import { PrinterFileService, SettingsService } from "@/backend";
import { PrinterSettingsService } from "@/backend/printer-settings.service";
import { printersState } from "@/store/printers.state";
import { infoMessageEvent } from "@/event-bus/alert.events";
import { PrinterFileCleanSettings } from "@/models/server-settings/printer-file-clean-settings.model";

@Component({})
export default class FdmSettings extends Vue {
  fileHandlingSettings: PrinterFileCleanSettings = {
    autoRemoveOldFilesBeforeUpload: false,
    autoRemoveOldFilesAtBoot: false,
    autoRemoveOldFilesCriteriumDays: 7
  };

  async created() {
    const serverSettings = await SettingsService.getServerSettings();
    this.fileHandlingSettings = serverSettings.printerFileClean;
  }

  async setFileHandlingClientSettings() {
    const serverSettings = await SettingsService.setFileHandlingClientSettings(
      this.fileHandlingSettings
    );
    this.fileHandlingSettings = serverSettings.printerFileClean;
  }

  async purgeFiles() {
    await PrinterFileService.purgeFiles();

    this.$bus.emit(infoMessageEvent, `Successfully purged all references to printer files!`);
  }

  async bulkDisableGCodeAnalysis() {
    const printers = printersState.onlinePrinters;
    this.$bus.emit(
      infoMessageEvent,
      `Trying to disable gcode analysis for ${printers.length} online printers.`
    );
    for (let printer of printers) {
      await PrinterSettingsService.setGCodeAnalysis(printer.id, false);
    }
    this.$bus.emit(
      infoMessageEvent,
      `Finished disabling gcode analysis for ${printers.length} online printers.`
    );
  }
}
</script>
