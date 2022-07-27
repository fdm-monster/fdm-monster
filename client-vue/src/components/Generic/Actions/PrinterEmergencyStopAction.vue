<template>
  <v-badge v-if="printer.enabled" bordered class="ma-2" overlap>
    <template v-slot:badge>
      <v-icon>bolt</v-icon>
    </template>
    <v-btn
      :color="printer.printerState.colour.name"
      fab
      small
      @click.c.capture.native.stop="clickEmergencyStop()"
    >
      <v-icon>stop</v-icon>
    </v-btn>
  </v-badge>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import { CustomGcodeService } from "@/backend/custom-gcode.service";

@Component({})
export default class PrinterEmergencyStopAction extends Vue {
  @Prop() printer: Printer;

  get printerId() {
    return this.printer.id;
  }

  async clickEmergencyStop() {
    if (confirm("Are you sure to abort the print? Please reconnect after.")) {
      await CustomGcodeService.postEmergencyM112Command(this.printer.id);
    }
  }
}
</script>
