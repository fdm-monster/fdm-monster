<template>
  <v-card>
    <v-toolbar color="primary">
      <v-avatar>
        <v-icon>settings</v-icon>
      </v-avatar>
      <v-toolbar-title>FDM Monster Settings</v-toolbar-title>
    </v-toolbar>
    <v-list subheader three-line>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>IP Whitelist</v-list-item-title>
          <v-list-item-subtitle>
            <v-alert color="primary">
              <v-icon>info</v-icon> &nbsp; Be cautious, setting the wrong whitelist could make you
              lose access to the server!
            </v-alert>
            Only allow access from specific IP Adresses or subnets. Note: 127.0.0.1 will always be
            allowed access. Examples:
            <br />
            <v-chip small>192.168</v-chip>
            <v-chip small>192.168.1</v-chip>
            <v-chip small>192.168.1.1</v-chip>
            <br />
            <v-row>
              <v-col cols="12" md="2">
                <v-checkbox v-model="whitelistEnabled" label="Enable IP Whitelist"></v-checkbox>
              </v-col>
            </v-row>
            <v-row class="mt-0">
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="ipAddress"
                  :disabled="!whitelistEnabled"
                  :rules="[ipAddressRule, (val) => !!val]"
                  append-icon="add"
                  label="IP Address"
                  @click:append="appendIpAddress(ipAddress)"
                >
                </v-text-field>
              </v-col>
              <v-col>
                <v-chip-group>
                  <v-chip
                    v-for="ip in whitelistedIpAddresses"
                    :key="ip"
                    :disabled="!whitelistEnabled"
                    close
                    @click:close="removeIpWhitelist(ip)"
                  >
                    {{ ip }}
                  </v-chip>
                </v-chip-group>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-btn color="default" @click="resetWhitelistSettingsToDefault()">
                  reset to default</v-btn
                >
                <v-btn color="primary" @click="setWhitelistSettings()">
                  save whitelist settings
                </v-btn>
              </v-col>
            </v-row>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

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
            <v-btn color="primary" @click="setFileCleanSettings()">save file clean settings</v-btn>
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
            <v-btn color="primary" @click="bulkDisableGCodeAnalysis()">
              Bulk disable GCode Analysis
            </v-btn>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { PrinterFileService, SettingsService } from "@/backend";
import { PrinterSettingsService } from "@/backend/printer-settings.service";
import { infoMessageEvent } from "@/event-bus/alert.events";
import { PrinterFileCleanSettings } from "@/models/server-settings/printer-file-clean-settings.model";
import { usePrintersStore } from "@/store/printers.store";
import { isValidIPOrMask } from "@/utils/validation.utils";

interface Data {
  ipAddress: string;
  whitelistEnabled: boolean;
  whitelistedIpAddresses: string[];
  fileHandlingSettings: PrinterFileCleanSettings;
}

export default defineComponent({
  name: "FdmSettings",
  setup: () => {
    return {
      printersStore: usePrintersStore(),
      ipAddressRule: (val: string) => (isValidIPOrMask(val) ? true : "Not a valid IP Address"),
    };
  },
  props: {},
  data: (): Data => ({
    ipAddress: "",
    fileHandlingSettings: {
      autoRemoveOldFilesBeforeUpload: false,
      autoRemoveOldFilesAtBoot: false,
      autoRemoveOldFilesCriteriumDays: 7,
    },
    whitelistEnabled: false,
    whitelistedIpAddresses: [],
  }),
  async created() {
    const serverSettings = await SettingsService.getServerSettings();
    this.whitelistedIpAddresses = serverSettings.server?.whitelistedIpAddresses;
    this.whitelistEnabled = serverSettings.server?.whitelistEnabled;
    this.fileHandlingSettings = serverSettings.printerFileClean;
  },
  mounted() {},
  computed: {},
  methods: {
    removeIpWhitelist(removedIp: string) {
      this.whitelistedIpAddresses = this.whitelistedIpAddresses.filter(
        (ip) => ip.toLowerCase() !== removedIp.toLowerCase()
      );
    },
    appendIpAddress(ip: string) {
      if (!isValidIPOrMask(ip)) return;
      this.whitelistedIpAddresses.push(ip.toLowerCase());
    },
    async resetWhitelistSettingsToDefault() {
      this.whitelistedIpAddresses = ["127.0.0.1", "::12"];
      this.whitelistEnabled = false;
      await this.setWhitelistSettings();
    },
    async setWhitelistSettings() {
      const serverSettings = await SettingsService.setWhitelistSettings({
        whitelistedIpAddresses: this.whitelistedIpAddresses,
        whitelistEnabled: this.whitelistEnabled,
      });
      this.whitelistedIpAddresses = serverSettings.server?.whitelistedIpAddresses;
      this.whitelistEnabled = serverSettings.server?.whitelistEnabled;
    },
    async setFileCleanSettings() {
      const serverSettings = await SettingsService.setFileCleanSettings(this.fileHandlingSettings);
      this.fileHandlingSettings = serverSettings.printerFileClean;
    },
    async purgeFiles() {
      await PrinterFileService.purgeFiles();

      this.$bus.emit(infoMessageEvent, `Successfully purged all references to printer files!`);
    },
    async bulkDisableGCodeAnalysis() {
      const printers = this.printersStore.onlinePrinters;
      this.$bus.emit(
        infoMessageEvent,
        `Trying to disable gcode analysis for ${printers.length} online printers.`
      );
      for (const printer of printers) {
        await PrinterSettingsService.setGCodeAnalysis(printer.id, false);
      }
      this.$bus.emit(
        infoMessageEvent,
        `Finished disabling gcode analysis for ${printers.length} online printers.`
      );
    },
  },
  watch: {},
});
</script>
