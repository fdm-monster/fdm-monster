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

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Server commands</v-list-item-title>
          <v-list-item-subtitle>
            Restart the server
            <br />
            <v-btn color="primary" @click="restartServer()">Restart server</v-btn>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ServerPrivateService } from "@/backend/server-private.service";

interface Data {
  property: number;
}

export default defineComponent({
  name: "OtherSettings",
  setup: () => {
    return {};
  },
  props: {},
  data: (): Data => ({
    property: 0,
  }),
  async created() {},
  async mounted() {},
  computed: {},
  methods: {
    async restartServer() {
      await ServerPrivateService.restartServer();
    },
  },
  watch: {},
});
</script>
