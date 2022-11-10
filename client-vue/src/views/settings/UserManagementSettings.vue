<template>
  <v-card>
    <v-toolbar color="primary">
      <v-avatar>
        <v-icon>settings</v-icon>
      </v-avatar>
      <v-toolbar-title>Users</v-toolbar-title>
    </v-toolbar>
    <v-list subheader three-line>
      <v-subheader>Showing current users</v-subheader>

      <v-list-item v-for="(user, index) in users" :key="index">
        <v-list-item-content>
          <v-list-item-title>
            User <strong>{{ user.name }}</strong>
          </v-list-item-title>
          <v-list-item-subtitle>
            Username <strong>{{ user.username }}</strong> <br />
            <br />
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            Created at <strong>{{ user.createdAt }}</strong> <br />
            Role count <strong>{{ user.roles.length }}</strong>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-divider></v-divider>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { UserService } from "@/backend/user.service";
import { User } from "@/models/user.model";

interface Data {
  users: User[];
}

export default defineComponent({
  name: "UserManagementSettings",
  setup: () => {
    return {};
  },
  props: {},
  data: (): Data => ({ users: [] }),
  async created() {
    this.users = await UserService.listUsers();
  },
  async mounted() {},
  computed: {},
  methods: {},
  watch: {},
});
</script>
