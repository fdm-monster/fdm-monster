<template>
  <v-container>
    3D Hub was created by D. Zwart (https://github.com/davidzwa) in collaboration with
    <strong><a href="https://mtb3d.com">MTB3D</a></strong>.

    <br />
    <br />
    Found a bug? Please report them here
    <strong><a href="https://github.com/3d-hub/3d-hub/issues">Github Issues</a></strong>

    <br />
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { printersState } from "@/store/printers.state";

@Component({
  components: {}
})
export default class AboutPage extends Vue {
  loaded = false;

  async created() {
    const printers = await printersState.loadPrinters();

    if (printers.length === 0) return;

    this.loaded = true;
  }
}
</script>
