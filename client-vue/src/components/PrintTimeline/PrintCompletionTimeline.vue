<template>
  <v-row>
    <v-col>
      <v-sheet height="100%" width="100%">
        <div>
          <v-row>
            <v-col>
              <v-icon>filter_list</v-icon>
              Filtering {{ filteredPrinterFloors.length }} of {{ printerFloors.length }} printer
              floors (optional)
            </v-col>
            <v-col>
              <v-select
                v-model="filteredPrinterFloors"
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
              Filtering {{ filteredPrinterGroups.length }} of {{ printerGroups.length }} printer
              groups (optional)
            </v-col>
            <v-col>
              <v-select
                v-model="filteredPrinterGroups"
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
              Filtering {{ filteredFdmPrinters.length }} of {{ floorGroupFdmPrinters.length }} FDM
              printers (optional)
            </v-col>
            <v-col>
              <v-select
                v-model="filteredFdmPrinters"
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
          <v-btn color="primary" x-small @click="loadCompletions()">Reload</v-btn>
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
                <td>
                  <v-tooltip bottom>
                    <template v-if="item.lastFailure?.status" v-slot:activator="{ on, attrs }">
                      <v-icon v-bind="attrs" v-on="on">info</v-icon>
                    </template>
                    <span>
                      {{ item.lastFailure?.status || "-" }} <br />
                      {{ item.lastFailure?.createdAt }} <br />
                      <small>{{ item.lastFailure?.fileName }}</small> <br />
                      <strong>{{ item.lastFailure?.completionLog }}</strong> <br />
                    </span>
                  </v-tooltip>
                </td>
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
import { PrinterCompletions } from "@/models/print-completions/print-completions.model";

export default Vue.extend({
  data(): {
    loadedCompletions: PrinterCompletions[];
    shownCompletions: PrinterCompletions[];
    floorGroupFdmPrinters: Printer[];
    filteredFdmPrinters: Printer[];
    filteredPrinterFloors: PrinterFloor[];
    printerGroups: PrinterGroup[];
    filteredPrinterGroups: PrinterGroup[];
  } {
    return {
      loadedCompletions: [],
      shownCompletions: [],
      // Final result of all groups/floors
      floorGroupFdmPrinters: [],
      filteredFdmPrinters: [],
      filteredPrinterFloors: [],
      printerGroups: [],
      filteredPrinterGroups: [],
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
    printerFloors() {
      this.updateFloors();
    },
    availablePrinterGroups() {
      this.updateGroups();
    },
    filteredPrinterFloors() {
      this.updateFloors();
    },
    filteredPrinterGroups() {
      this.updateGroups();
    },
    filteredFdmPrinters() {
      this.updatePrinters();
    },
  },
  methods: {
    async loadCompletions() {
      this.loadedCompletions = [];
      this.shownCompletions = [];
      this.loadedCompletions = await PrintCompletionsService.getCompletions();
      this.updatePrinters();
    },
    printer: (printerId: string) => {
      return printersState.printer(printerId);
    },
    groupOfPrinter: (printerId: string) => {
      return printersState.groupOfPrinter(printerId);
    },
    floorOfPrinterGroup: (printerGroupId: string) => {
      return printersState.floorOfGroup(printerGroupId);
    },
    updateFloors() {
      if (!this.filteredPrinterFloors?.length) {
        this.printerGroups = this.availablePrinterGroups;
        return;
      }
      const flattenedGroupIds = this.filteredPrinterFloors.flatMap((pf) => {
        return pf.printerGroups.map((pg) => pg.printerGroupId);
      });
      this.printerGroups = this.availablePrinterGroups.filter((pg) => {
        if (!pg._id) return false;
        return flattenedGroupIds.includes(pg._id);
      });
    },
    updateGroups() {
      let usedFilter = this.filteredPrinterGroups;
      if (!this.filteredPrinterGroups.length) {
        usedFilter = this.printerGroups;
      }
      const flattenedPrinterIds = usedFilter.flatMap((pg) => {
        return pg.printers.map((p) => p.printerId);
      });

      this.floorGroupFdmPrinters = flattenedPrinterIds.map((fpId) => printersState.printer(fpId)!);
    },
    updatePrinters() {
      const pIds = this.filteredFdmPrinters.map((p) => p.id);
      this.shownCompletions = pIds.length
        ? this.loadedCompletions.filter((c) => pIds.includes(c._id))
        : this.loadedCompletions;
    },
  },
});
</script>

<style lang="scss"></style>
