<template>
  <v-container>
    <Login />
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Login from "@/components/Login.vue";
import { Component } from "vue-property-decorator";

@Component({
  components: { Login }
})
export default class Map extends Vue {}
</script>
