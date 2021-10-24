<template>
  <span>
    <h1>
      3D HUB
    </h1>
  </span>
</template>

<script>
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { PrinterGroupService, PrinterFileService } from "@/backend";
import { infoMessageEvent } from "@/event-bus/alert.events";
import { printersState } from "@/store/printers.state";
import { PrinterSettingsService } from "@/backend/printer-settings.service";

@Component({
  components: {},
})
export default class PrinterGroupsSettings extends Vue {

}
</script>
