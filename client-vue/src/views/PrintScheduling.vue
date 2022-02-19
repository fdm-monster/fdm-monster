<template>
  <v-container>
    On this page we can manage scheduling of prints and track back what was printed when.

    <CalendarView />
  </v-container>
</template>
<script>
import CalendarView from "@/components/PrintScheduling/CalendarView";
export default {
  components: { CalendarView }
};
</script>
