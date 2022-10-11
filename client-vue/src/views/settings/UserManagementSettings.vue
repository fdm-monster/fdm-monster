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
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { UserService } from "@/backend/user.service";
import { User } from "@/models/user.model";

@Component({
  components: {},
  data: () => ({ users: [] }),
})
export default class UserManagementSettings extends Vue {
  users: User[];

  async created() {
    this.users = await UserService.listUsers();
  }
}
</script>
