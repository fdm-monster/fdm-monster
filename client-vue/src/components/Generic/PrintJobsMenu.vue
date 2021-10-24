<template>
  <div class="text-center">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      :nudge-width="200"
      bottom
      offset-x
      offset-y
      right
      transition="slide-x-transition"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs" v-on="on" dark>
          <span>Print jobs</span>
          <v-icon right>work</v-icon>
        </v-btn>
      </template>

      <v-card>
        <v-list>
          <v-list-item>
            <v-list-item-avatar size="50">
              <v-avatar color="primary"> {{ activePrintCount }}</v-avatar>
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title>Print Jobs</v-list-item-title>
              <v-list-item-subtitle>All active files being printed</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-list>
          <v-list-item v-for="job of activePrintJobs" :key="job.fileName">
            <v-list-item-action>
              <v-progress-circular
                :size="50"
                :value="job.progress"
                :width="5"
                color="green"
              >
                {{ job.progress }}
              </v-progress-circular>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>
                {{ job.fileName }}
              </v-list-item-title>
              <v-list-item-subtitle>
                Elapsed: {{ Math.round(job.printTimeElapsed / 60) }} minutes
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn text @click="menu = false"> Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import Vue from "vue";
import Component from "vue-class-component";
import { printersState } from "@/store/printers.state";
import { PrinterCurrentJob } from "@/models/printers/printer-current-job.model";
import { PrinterJob } from "@/models/printers/printer-current-job.model";

@Component({
  data: () => ({
    fav: true,
    menu: false,
    message: false,
    hints: true
  })
})
export default class PrintJobsMenu extends Vue {
  get activePrintJobs() {
    return printersState.printersWithJob.map(p => p.currentJob);
  }

  get activePrintCount() {
    return printersState.printersWithJob?.length;
  }
}
</script>
