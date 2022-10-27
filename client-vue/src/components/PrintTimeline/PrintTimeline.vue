<template>
  <v-row>
    <v-col>
      <v-sheet height="100%" width="100%">
        <div>
          <v-icon>filter_list</v-icon>
          Filter FDM events <v-select :items="fdmEventTypes" label="Events" multiple> </v-select>
          <v-icon>filter_list</v-icon>
          Filter OctoPrint events <v-select :items="eventTypes" label="Events" multiple> </v-select>
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
              <tr v-for="item in events" :key="item.name">
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

export default Vue.extend({
  data: () =>
    ({
      events: [],
      eventTypes: [],
      fdmEventTypes: [],
    } as { events: any[]; eventTypes: string[]; fdmEventTypes: string[] }),
  computed: {},
  async mounted() {
    const sseClient = await this.$sse.create({
      format: "json",
      forcePolyfill: true,
      url: apiBase + "/api/history/sse",
    });
    sseClient.on("message", (msg: any) => {
      console.log(msg);
      msg.timestamp = new Date().toLocaleTimeString();

      this.events = [msg, ...this.events];
      this.fdmEventTypes = this.events.map((e) => e.fdmEvent);
      this.eventTypes = this.events.map((e) => e.octoPrintEvent);
    });
    sseClient.connect().catch((err) => console.error("Failed make initial connection:", err));
  },
  methods: {},
});
</script>

<style lang="scss"></style>
