<template>
  <v-container>
    3D Print Farm was created by D. Zwart (https://github.com/davidzwa) in collaboration with
    <strong><a href="https://mtb3d.com">MTB3D</a></strong> as a spin-off of OctoFarm.

    <br />
    <br />
    Found a bug? Please report them here
    <strong><a href="https://github.com/davidzwa/3d-print-farm/issues">Github Issues</a></strong>

    <br />
    <!--    Experiment with iFraming OctoPrint -->
    <!--    <iframe-->
    <!--      v-if="loaded"-->
    <!--      :height="iframe.style.height"-->
    <!--      :src="iframe.src"-->
    <!--      :style="iframe.style"-->
    <!--      :width="iframe.style.width"-->
    <!--      frameborder="0"-->
    <!--    ></iframe>-->
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { Action } from "vuex-class";
import { Printer } from "@/models/printers/printer.model";

@Component({
  components: {}
})
export default class AboutPage extends Vue {
  @Action loadPrinters: () => Promise<Printer[]>;

  loaded = false;
  iframe: any = {
    src: "",
    style: {
      height: "500px",
      width: "100%"
    }
  };

  async created() {
    const printers = await this.loadPrinters();

    if (printers.length === 0) return;

    this.iframe.src = printers[0].printerURL;
    this.loaded = true;
  }
}
</script>
