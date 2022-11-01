<template>
  <v-row>
    <v-col>
      <v-sheet height="100%" width="100%">
        <div>
          <v-row>
            <v-col>
              <v-icon>filter_list</v-icon>
              Filtering {{ filterPrinterFloors.length }} of {{ printerFloors.length }} printer
              floors (optional)
            </v-col>
            <v-col>
              <v-select
                v-model="filterPrinterFloors"
                :items="printerFloors"
                clearable
                item-text="name"
                label="Printer Floors"
                multiple
                return-object
              >
              </v-select>
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-icon>filter_list</v-icon>
              Filtering {{ filterPrinterGroups.length }} of {{ printerGroups.length }} printer
              groups (optional)
            </v-col>
            <v-col>
              <v-select
                v-model="filterPrinterGroups"
                :items="printerGroups"
                clearable
                item-text="name"
                label="Printer groups"
                multiple
                return-object
              >
              </v-select>
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-icon>filter_list</v-icon>
              Filtering {{ filterFdmPrinters.length }} of {{ floorGroupFdmPrinters.length }} FDM
              printers (optional)
            </v-col>
            <v-col>
              <v-select
                v-model="filterFdmPrinters"
                :items="floorGroupFdmPrinters"
                clearable
                item-text="printerName"
                label="FDM Printers"
                multiple
                open-on-clear
                return-object
              >
              </v-select>
            </v-col>
          </v-row>
        </div>
        <hr />
        <v-alert>
          Please reload here if you want updated results:
          <v-btn color="primary" @click="loadCompletions()">Reload</v-btn>
        </v-alert>
        <v-simple-table dark>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left">Printer name</th>
                <th class="text-left">Printer group</th>
                <th class="text-left">Printer floor</th>
                <th class="text-left">Succ/ Fail/ Total</th>
                <th class="text-left">Last success</th>
                <th class="text-left">Last failure</th>
                <th class="text-left">Successes (week/48H/24H)</th>
                <th class="text-left">Failures (week/48H/24H)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in shownCompletions" :key="item.name">
                <td>{{ printer(item._id)?.printerName }}</td>
                <td>{{ groupOfPrinter(item._id)?.name }}</td>
                <td>{{ floorOfPrinterGroup(groupOfPrinter(item._id)?._id)?.name }}</td>
                <td>
                  &#215; {{ item.failureCount }} / &#128504; {{ item.successCount }}
                  <strong>~{{ item.printCount }}</strong>
                </td>
                <td>{{ Date.now() - item.lastSuccess?.createdAt || "-" }}</td>
                <td>{{ Date.now() - item.lastFailure?.createdAt || "-" }}</td>
                <td>
                  {{ item.successEventsLastWeek }} {{ item.successEventsLast48H }}
                  {{ item.successEventsLast24H }}
                </td>
                <td>
                  {{ item.failureEventsLastWeek }} {{ item.failureEventsLast48H }}
                  {{ item.failureEventsLast24H }}
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-sheet>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from "vue";
import { printersState } from "@/store/printers.state";
import { PrinterFloor } from "@/models/printer-floor/printer-floor.model";
import { PrinterGroup } from "@/models/printer-groups/printer-group.model";
import { Printer } from "@/models/printers/printer.model";
import { PrintCompletionsService } from "@/backend/print-completions.service";
import { PrintCompletionsModel } from "@/models/print-completions/print-completions.model";

export default Vue.extend({
  data(): {
    shownCompletions: PrintCompletionsModel;
    floorGroupFdmPrinters: Printer[];
    filterFdmPrinters: Printer[];
    filterPrinterFloors: PrinterFloor[];
    printerGroups: PrinterGroup[];
    filterPrinterGroups: PrinterGroup[];
  } {
    return {
      shownCompletions: [],
      // Final result of all groups/floors
      floorGroupFdmPrinters: [],
      filterFdmPrinters: [],
      filterPrinterFloors: [],
      printerGroups: [],
      filterPrinterGroups: [],
    };
  },
  async created() {
    await this.loadCompletions();
  },
  computed: {
    printerFloors: () => {
      return printersState.printerFloors;
    },
    availablePrinterGroups: () => {
      return printersState.printerGroups;
    },
  },
  watch: {
    events() {
      this.updateShownEvents();
    },
    filterStateTypes() {
      this.updateShownEvents();
    },
    filterEventTypes() {
      this.updateShownEvents();
    },
    filterFdmEventTypes() {
      this.updateShownEvents();
    },
    printerFloors() {
      this.updateFloors();
    },
    availablePrinterGroups() {
      this.updateGroups();
    },
    filterPrinterFloors() {
      this.updateFloors();
    },
    filterPrinterGroups() {
      this.updateGroups();
    },
  },
  methods: {
    printer: (printerId: string) => {
      return printersState.printer(printerId);
    },
    groupOfPrinter: (printerId: string) => {
      return printersState.groupOfPrinter(printerId);
    },
    floorOfPrinterGroup: (printerGroupId: string) => {
      return printersState.floorOfGroup(printerGroupId);
    },
    async loadCompletions() {
      this.shownCompletions = await PrintCompletionsService.getCompletions();
    },
    updateFloors() {
      if (!this.filterPrinterFloors?.length) {
        this.printerGroups = this.availablePrinterGroups;
        return;
      }
      const flattenedGroupIds = this.filterPrinterFloors.flatMap((pf) => {
        return pf.printerGroups.map((pg) => pg.printerGroupId);
      });
      this.printerGroups = this.availablePrinterGroups.filter((pg) => {
        if (!pg._id) return false;
        return flattenedGroupIds.includes(pg._id);
      });
    },
    updateGroups() {
      let usedFilter = this.filterPrinterGroups;
      if (!this.filterPrinterGroups.length) {
        usedFilter = this.printerGroups;
      }
      const flattenedPrinterIds = usedFilter.flatMap((pg) => {
        return pg.printers.map((p) => p.printerId);
      });

      this.floorGroupFdmPrinters = flattenedPrinterIds.map((fpId) => printersState.printer(fpId)!);
    },
    updateShownEvents() {
      this.shownCompletions = [];
    },
  },
});
</script>

<style lang="scss"></style>
