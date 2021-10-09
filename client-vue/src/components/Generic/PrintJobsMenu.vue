<template>
  <div class="text-center">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      :nudge-width="200"
      bottom
      right
      offset-x
      offset-y
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
              <v-avatar color="primary"> 1963 </v-avatar>
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title>Print Jobs</v-list-item-title>
              <v-list-item-subtitle>All active files being printed</v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action>
              <v-btn :class="fav ? 'red--text' : ''" icon @click="fav = !fav">
                <v-icon>mdi-heart</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-list>
          <v-list-item>
            <v-list-item-action>
              <v-switch v-model="message" color="purple"></v-switch>
            </v-list-item-action>
            <v-list-item-title>Test prop1</v-list-item-title>
          </v-list-item>

          <v-list-item>
            <v-list-item-action>
              <v-switch v-model="hints" color="purple"></v-switch>
            </v-list-item-action>
            <v-list-item-title>Test prop2</v-list-item-title>
          </v-list-item>
        </v-list>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn text @click="menu = false"> Cancel</v-btn>
          <v-btn color="primary" text @click="menu = false"> Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import Vue from "vue";
import Component from "vue-class-component";

@Component({
  data: () => ({
    fav: true,
    menu: false,
    message: false,
    hints: true
  })
})
export default class PrintJobsMenu extends Vue {}
</script>
