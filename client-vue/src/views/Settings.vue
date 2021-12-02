<template>
  <v-container>
    <v-row no-gutters>
      <v-col cols="2">
        <v-navigation-drawer permanent>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="text-h6"> Settings</v-list-item-title>
              <v-list-item-subtitle> Adjust your Hub</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-divider></v-divider>

          <v-list dense nav>
            <v-list-item v-for="item in items" :key="item.title" :to="item.path" link router-link>
              <v-list-item-icon>
                <v-icon>{{ item.icon }}</v-icon>
              </v-list-item-icon>

              <v-list-item-content>
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-navigation-drawer>
      </v-col>
      <v-col>
        <router-view></router-view>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({
  components: {},
  data() {
    return {
      items: [
        { title: "Printer groups", icon: "dashboard", path: "/settings/printer-groups" },
        { title: "User Management", icon: "group", path: "/settings/user-management" },
        { title: "Hub settings", icon: "image", path: "/settings/system" },
        { title: "Other", icon: "help", path: "/settings/other" }
      ]
    };
  }
})
export default class Settings extends Vue {}
</script>
