<template>
  <v-card>
    <v-toolbar color="primary">
      <v-avatar>
        <v-icon>settings</v-icon>
      </v-avatar>
      <v-toolbar-title>Other Settings</v-toolbar-title>
    </v-toolbar>
    <v-list subheader three-line>
      <v-subheader>Other Settings</v-subheader>

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Other Settings Subgroup</v-list-item-title>
          <v-list-item-subtitle>
            Some other settings will come here
            <br />
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({
  components: {},
})
export default class OtherSettings extends Vue {}
</script>
