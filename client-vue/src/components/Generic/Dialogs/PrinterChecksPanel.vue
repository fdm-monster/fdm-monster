<template>
  <v-col :cols="cols">
    <strong>Checks:</strong>
    <v-alert
      v-if="testProgress && isSet(testProgress.connected)"
      :type="testProgress.connected ? 'success' : 'error'"
      dense
      text
    >
      <small>Connected</small>
    </v-alert>
    <v-alert
      v-if="testProgress && isSet(testProgress.isOctoPrint)"
      :type="testProgress.isOctoPrint ? 'success' : 'error'"
      dense
      text
    >
      <small>Is OctoPrint</small>
    </v-alert>
    <v-alert
      v-if="testProgress && isSet(testProgress.apiOk)"
      :type="testProgress.apiOk ? 'success' : 'error'"
      dense
      text
    >
      <small>API ok</small>
    </v-alert>
    <v-alert
      v-if="testProgress && isSet(testProgress.apiKeyNotGlobal)"
      :type="testProgress.apiKeyNotGlobal ? 'success' : 'error'"
      dense
      text
    >
      <small>Key not Global API Key</small>
    </v-alert>
    <v-alert
      v-if="testProgress && isSet(testProgress.apiKeyOk)"
      :type="testProgress.apiKeyOk ? 'success' : 'error'"
      dense
      text
    >
      <small>Key accepted</small>
    </v-alert>
    <v-alert
      v-if="testProgress && isSet(testProgress.websocketBound)"
      :type="testProgress.websocketBound ? 'success' : 'error'"
      dense
      text
    >
      <small>WebSocket bound</small>
    </v-alert>

    <slot></slot>
  </v-col>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { TestProgressDetails } from "@/models/sse-messages/printer-sse-message.model";

interface Data {
  cols: 4;
}

export default defineComponent({
  name: "PrinterChecksPanel",
  components: {},
  props: {
    testProgress: Object as PropType<TestProgressDetails>,
  },
  data: (): Data => ({
    cols: 4,
  }),
  methods: {
    isSet(value: boolean) {
      return value === false || value === true;
    },
  },
});
</script>
