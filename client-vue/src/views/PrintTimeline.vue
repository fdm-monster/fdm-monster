<template>
  <v-container>
    <PrinterCompletionsTimeline />
  </v-container>
</template>
<script>
// import PrintEventTracker from "@/components/PrintTimeline/PrintEventTracker.vue";
import PrinterCompletionsTimeline from "@/components/PrintTimeline/PrintCompletionTimeline.vue";
export default {
  components: { PrinterCompletionsTimeline },
};
</script>
