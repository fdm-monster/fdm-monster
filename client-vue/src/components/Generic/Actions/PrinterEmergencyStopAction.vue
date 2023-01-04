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
import { defineComponent, PropType } from "vue";
import { Printer } from "@/models/printers/printer.model";
import { CustomGcodeService } from "@/backend/custom-gcode.service";

export default defineComponent({
  name: "PrinterEmergencyAction",
  props: {
    printer: Object as PropType<Printer>,
  },
  computed: {
    printerId() {
      return this.printer!.id;
    },
  },
  methods: {
    async clickEmergencyStop() {
      if (confirm("Are you sure to abort the print? Please reconnect after.")) {
        await CustomGcodeService.postEmergencyM112Command(this.printer!.id);
      }
    },
  },
});
</script>
