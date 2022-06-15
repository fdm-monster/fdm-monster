<template>
  <v-footer padless>
    <v-btn absolute color="primary" dark fab right small top @click="togglePrinterSlideGroup">
      <v-icon v-if="openPrinterSlideGroup" dark> close</v-icon>
      <v-icon v-if="!openPrinterSlideGroup" dark>expand_less</v-icon>
    </v-btn>
    <v-slide-group
      v-if="openPrinterSlideGroup"
      v-model="selectedPrinter"
      active-class="success"
      center-active
      class="pa-4"
      show-arrows
      small
    >
      <v-slide-item v-for="n in 15" :key="n" v-slot="{ active, toggle }">
        <v-card
          :color="active ? undefined : 'grey lighten-1'"
          class="ma-4"
          height="200"
          width="100"
          @click="toggle"
        >
          <v-row align="center" class="fill-height" justify="center">
            <v-scale-transition>
              <v-icon
                v-if="active"
                color="white"
                size="48"
                v-text="'mdi-close-circle-outline'"
              ></v-icon>
            </v-scale-transition>
          </v-row>
        </v-card>
      </v-slide-item>
    </v-slide-group>
    <v-col class="text-center" cols="12">
      {{ new Date().getFullYear() }} — <strong>D. Zwart</strong>
    </v-col>
  </v-footer>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component({
  data: () => ({ openPrinterSlideGroup: false, selectedPrinter: null })
})
export default class FooterList extends Vue {
  openPrinterSlideGroup: boolean;

  togglePrinterSlideGroup() {
    this.openPrinterSlideGroup = !this.openPrinterSlideGroup;
  }
}
</script>
