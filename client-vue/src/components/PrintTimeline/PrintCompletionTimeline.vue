<template>
  <v-row>
    <v-col>
      <v-sheet height="100%" width="100%">
        <v-container>
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
          <v-row>
            <v-col>Filter by printer name (optional)</v-col>
            <v-col>
              <v-text-field
                v-model="printerNameSearch"
                class="p-2"
                clearable
                label="Search"
                prepend-icon="search"
                single-line
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
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
                <th class="text-left">Fail/ Success/ Total</th>
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
import { defineComponent } from "vue";
import { PrinterFloor } from "@/models/printer-floor/printer-floor.model";
import { PrinterGroup } from "@/models/printer-groups/printer-group.model";
import { Printer } from "@/models/printers/printer.model";
import { PrintCompletionsService } from "@/backend/print-completions.service";
import { PrinterCompletions } from "@/models/print-completions/print-completions.model";
import { usePrintersStore } from "@/store/printers.store";

interface Data {
  loadedCompletions: PrinterCompletions[];
  shownCompletions: PrinterCompletions[];
  floorGroupFdmPrinters: Printer[];
  filteredFdmPrinters: Printer[];
  filteredPrinterFloors: PrinterFloor[];
  printerGroups: PrinterGroup[];
  filteredPrinterGroups: PrinterGroup[];
  printerNameSearch: string;
}

export default defineComponent({
  name: "PrintCompletionTimeline",
  components: {},
  setup: () => {
    return {
      printersStore: usePrintersStore(),
    };
  },
  data(): Data {
    return {
      loadedCompletions: [],
      shownCompletions: [],
      // Final result of all groups/floors
      floorGroupFdmPrinters: [],
      filteredFdmPrinters: [],
      filteredPrinterFloors: [],
      printerGroups: [],
      filteredPrinterGroups: [],
      printerNameSearch: "",
    };
  },
  async mounted() {
    await this.loadCompletions();
  },
  computed: {
    printerFloors() {
      return this.printersStore.printerFloors;
    },
    availablePrinterGroups() {
      return this.printersStore.printerGroups;
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
    printerNameSearch() {
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
    printer(printerId: string) {
      return this.printersStore.printer(printerId);
    },
    groupOfPrinter(printerId: string) {
      return this.printersStore.groupOfPrinter(printerId);
    },
    floorOfPrinterGroup(printerGroupId: string) {
      return this.printersStore.floorOfGroup(printerGroupId);
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

      this.floorGroupFdmPrinters = flattenedPrinterIds.map(
        (fpId) => this.printersStore.printer(fpId)!
      );
    },
    updatePrinters() {
      const pIds = this.filteredFdmPrinters.map((p) => p.id);
      const preSearchPrinters = pIds.length
        ? this.loadedCompletions.filter((c) => pIds.includes(c._id))
        : this.loadedCompletions;

      const preSortPrinters = this.printerNameSearch?.length
        ? preSearchPrinters.filter((p) => {
            const printer = this.floorGroupFdmPrinters.find((f) => f.id === p._id);
            if (!printer) return false;

            return (printer.printerName + printer.printerURL)
              .toLowerCase()
              .includes(this.printerNameSearch.toLowerCase());
          })
        : preSearchPrinters;

      this.shownCompletions = preSortPrinters.sort((p1, p2) => {
        if (p1.failureCount === p2.failureCount) {
          return p1.printCount > p2.printCount ? -1 : 1;
        }
        return p1.failureCount > p2.failureCount ? -1 : 1;
      });
    },
  },
});
</script>

<style lang="scss"></style>
