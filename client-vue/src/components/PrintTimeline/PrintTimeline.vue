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
              </v-select
            ></v-col>
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
              printers <strong>&nbsp;(required)</strong> </v-col
            ><v-col>
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
          <v-row>
            <v-col>
              <v-icon>filter_list</v-icon>
              Filtering {{ filterEventTypes.length }} of {{ eventTypes.length }} OctoPrint events
              (optional)
            </v-col>

            <v-col>
              <v-select
                v-model="filterEventTypes"
                :items="eventTypes"
                clearable
                label="OctoPrint Events"
                multiple
              >
              </v-select>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-icon>filter_list</v-icon>
              Filtering {{ filterStateTypes.length }} of {{ stateTypes.length }} states (optional)
            </v-col>
            <v-col>
              <v-select
                v-model="filterStateTypes"
                :items="stateTypes"
                clearable
                label="Printer state labels"
                multiple
              >
              </v-select>
            </v-col>
          </v-row>
        </div>
        <hr />
        <v-simple-table dark>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left">FDM event</th>
                <th class="text-left">OctoPrint Event</th>
                <th class="text-left">Time</th>
                <th class="text-left">State</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in shownEvents" :key="item.name">
                <td>{{ item.fdmEvent }}</td>
                <td>{{ item.octoPrintEvent }}</td>
                <td>{{ item.timestamp }}</td>
                <td>{{ item.data?.plugin }} {{ item.data?.state?.text }} {{ item.data?.type }}</td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-sheet>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { apiBase } from "@/backend/base.service";
import Vue from "vue";
import { distinct } from "@/utils/array.utils";
import { printersState } from "@/store/printers.state";
import { PrinterFloor } from "@/models/printer-floor/printer-floor.model";
import { PrinterGroup } from "@/models/printers/printer-group.model";
import { Printer } from "@/models/printers/printer.model";

export default Vue.extend({
  data: () =>
    ({
      events: [],
      shownEvents: [],
      eventTypes: [],
      filterEventTypes: [],
      fdmEventTypes: [],
      // Final result of all groups/floors
      floorGroupFdmPrinters: [],
      filterFdmPrinters: [],
      filterPrinterFloors: [],
      printerGroups: [],
      filterPrinterGroups: [],
      stateTypes: [],
      filterStateTypes: [],
      // implement
      showPlugins: false,
    } as {
      events: any[];
      shownEvents: any[];
      eventTypes: string[];
      filterEventTypes: string[];
      fdmEventTypes: string[];
      floorGroupFdmPrinters: Printer[];
      filterFdmPrinters: Printer[];
      filterPrinterFloors: PrinterFloor[];
      printerGroups: PrinterGroup[];
      filterPrinterGroups: PrinterGroup[];
      stateTypes: string[];
      filterStateTypes: string[];
      showPlugins: boolean;
    }),
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
  async mounted() {
    const sseClient = await this.$sse.create({
      format: "json",
      forcePolyfill: true,
      url: apiBase + "/api/history/sse",
    });
    sseClient.on("message", (msg: any) => {
      msg.timestamp = new Date().toLocaleTimeString();
      this.events = [msg, ...this.events];
      this.fdmEventTypes = this.events.map((e) => e.fdmEvent).filter(distinct);
      this.stateTypes = this.events
        .filter((e) => e.data?.state)
        .map((e) => e.data?.state?.text)
        .filter(distinct);
      this.eventTypes = this.events.map((e) => e.octoPrintEvent).filter(distinct);
    });
    sseClient.connect().catch((err) => console.error("Failed make initial connection:", err));
  },
  methods: {
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
      const printerEventNames = this.filterFdmPrinters.map((p) => `octoprint.${p.id}`);
      this.shownEvents = this.events.filter(
        (e) =>
          printerEventNames.includes(e.fdmEvent) &&
          (!this.filterEventTypes.length || this.filterEventTypes.includes(e.octoPrintEvent)) &&
          (!this.filterStateTypes.length ||
            (e.item.data?.state && this.filterStateTypes.includes(e.item.data?.state?.text)))
      );
    },
  },
});
</script>

<style lang="scss"></style>
