<template>
  <v-row>
    <v-col>
      <v-sheet height="100%" width="100%">
        <div>
          <v-row>
            <v-icon>filter_list</v-icon>
            Filtering {{ filterPrinterFloors.length }} of {{ printerFloors.length }} printer floors
            (optional)
            <v-select
              v-model="filterPrinterFloors"
              :items="printerFloors"
              item-text="name"
              return-object
              label="Printer Floors"
              multiple
            >
            </v-select>
          </v-row>

          <v-row>
            <v-icon>filter_list</v-icon>
            Filtering {{ filterPrinterGroups.length }} of {{ printerGroups.length }} printer groups
            (optional)
            <v-select
              v-model="filterPrinterGroups"
              item-text="name"
              :items="printerGroups"
              return-object
              label="Printer groups"
              multiple
            >
            </v-select>
          </v-row>

          <v-row>
            <v-icon>filter_list</v-icon>
            Filtering {{ filterFdmEventTypes.length }} of {{ floorGroupFdmEventTypes.length }} FDM
            printers
            <strong>&nbsp;(required)</strong>
            <v-select
              v-model="filterFdmEventTypes"
              :items="floorGroupFdmEventTypes"
              label="FDM Printers"
              multiple
            >
            </v-select>
          </v-row>
          <v-row>
            <v-icon>filter_list</v-icon>
            Filtering {{ filterEventTypes.length }} of {{ eventTypes.length }} OctoPrint events
            (optional)
            <v-select
              v-model="filterEventTypes"
              :items="eventTypes"
              label="OctoPrint Events"
              multiple
            >
            </v-select>
          </v-row>
          <v-row>
            <v-icon>filter_list</v-icon>
            Filtering {{ filterStateTypes.length }} of {{ stateTypes.length }} states (optional)
            <v-select
              v-model="filterStateTypes"
              :items="stateTypes"
              label="Printer state labels"
              multiple
            >
            </v-select>
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

export default Vue.extend({
  data: () =>
    ({
      events: [],
      shownEvents: [],
      eventTypes: [],
      filterEventTypes: [],
      fdmEventTypes: [],
      // Final result of all groups/floors
      floorGroupFdmEventTypes: [],
      filterFdmEventTypes: [],
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
      floorGroupFdmEventTypes: string[];
      filterFdmEventTypes: string[];
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
      const flattenedPrinterIds = this.printerGroups.flatMap((pg) => {
        return pg.printers.map((p) => p.printerId);
      });
      this.floorGroupFdmEventTypes = flattenedPrinterIds.map((fpId) => `octoprint.${fpId}`);
    },
    updateShownEvents() {
      this.shownEvents = this.events.filter(
        (e) =>
          this.filterFdmEventTypes.includes(e.fdmEvent) &&
          (!this.filterEventTypes.length || this.filterEventTypes.includes(e.octoPrintEvent)) &&
          (!this.filterStateTypes.length ||
            (e.item.data?.state && this.filterStateTypes.includes(e.item.data?.state?.text)))
      );
    },
  },
});
</script>

<style lang="scss"></style>
