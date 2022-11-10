<template>
  <v-container fill-height fluid>
    <v-layout align-center justify-center>
      <v-flex md4 sm8 xs12>
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark>
            <v-toolbar-title>Login</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form>
              <v-text-field
                label="Login"
                name="login"
                prepend-icon="person"
                type="text"
              ></v-text-field>
              <v-text-field
                id="password"
                label="Password"
                name="password"
                prepend-icon="lock"
                type="password"
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" to="/">Register</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" to="/">Login</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";

interface Data {}

export default defineComponent({
  name: "Login",
  components: {},
  setup: () => {
    return {};
  },
  async created() {},
  async mounted() {},
  props: {},
  data: (): Data => ({
    property: 0,
  }),
  computed: {},
  methods: {},
  watch: {},
});
</script>

<style></style>
