<template>
  <v-container>
    <v-toolbar color="primary">
      <v-btn dark icon>
        <v-icon>settings</v-icon>
      </v-btn>
      <v-toolbar-title>Hub Settings</v-toolbar-title>
    </v-toolbar>
    <v-list subheader three-line>
      <v-subheader>Groups and Files</v-subheader>

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Legacy Groups</v-list-item-title>
          <v-list-item-subtitle>
            Synchronise the legacy printer groups to the new separate PrinterGroup data.
            <br/>
            <v-btn color="primary" @click="syncLegacyGroups()">Sync legacy</v-btn>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Clean file references</v-list-item-title>
          <v-list-item-subtitle>
            Clear out the file references for all printers - this does not remove them from
            OctoPrint!
            <br/>
            <v-btn color="primary" @click="purgeFiles()">Purge file references</v-btn>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Disable inefficient GCode analysis</v-list-item-title>
          <v-list-item-subtitle>
            Disable GCode analysis on all printers at once, preventing CPU intensive and inaccurate
            time/size estimates.
            <br/>
            <v-btn color="primary" @click="bulkDisableGCodeAnalysis()"
            >Bulk disable GCode Analysis
            </v-btn
            >
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-divider></v-divider>
    <v-list v-show="false" subheader three-line>
      <v-subheader>General</v-subheader>
      <v-list-item>
        <v-list-item-action>
          <v-checkbox v-model="notifications"></v-checkbox>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>Notifications</v-list-item-title>
          <v-list-item-subtitle>
            Notify me about updates to apps or games that I downloaded
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item>
        <v-list-item-action>
          <v-checkbox v-model="sound"></v-checkbox>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>Sound</v-list-item-title>
          <v-list-item-subtitle
          >Auto-update apps at any time. Data charges may apply
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item>
        <v-list-item-action>
          <v-checkbox v-model="widgets"></v-checkbox>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>Auto-add widgets</v-list-item-title>
          <v-list-item-subtitle>Automatically add home screen widgets</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component()
export default class SystemSettings extends Vue {

}
</script>
