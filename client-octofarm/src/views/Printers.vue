<template>
  <v-container> Printers
  <v-data-table>

  </v-data-table>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Map from "../components/Map.vue";
import { Component } from "vue-property-decorator";

@Component({
  components: { Map }
})
export default class Printers extends Vue {}
</script>
