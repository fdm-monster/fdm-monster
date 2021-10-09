<template>
  <v-container>
    <LocationMap />
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import LocationMap from "../components/PrinterGrid/LocationMap.vue";
import { Component } from "vue-property-decorator";

@Component({
  components: { LocationMap }
})
export default class HomePage extends Vue {}
</script>
