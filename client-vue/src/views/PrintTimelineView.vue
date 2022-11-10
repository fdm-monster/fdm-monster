<template>
  <v-container>
    <PrinterCompletionsTimeline />
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PrinterCompletionsTimeline from "@/components/PrintTimeline/PrintCompletionTimeline.vue";

export default defineComponent({
  name: "PrintTimelineView",
  components: { PrinterCompletionsTimeline },
});
</script>
