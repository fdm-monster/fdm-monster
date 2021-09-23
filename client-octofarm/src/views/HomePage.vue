<template>
  <v-container>
    <Map />
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Map from "../components/Map.vue";
import { Component } from "vue-property-decorator";

@Component({
  components: { Map }
})
export default class HomePage extends Vue {
}
</script>
