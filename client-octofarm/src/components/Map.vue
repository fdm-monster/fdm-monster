<template>
  <v-container>
    <Login />
    <PrinterGrid />
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Login from "@/components/Login.vue";
import { Component } from "vue-property-decorator";
import PrinterGrid from "@/components/PrinterGrid.vue";

@Component({
  components: { Login, PrinterGrid }
})
export default class Map extends Vue {
  /*
  Work in progress
   */
}
</script>
