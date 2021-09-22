<template>
  <v-container>
    <Login></Login>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Login from "@/components/Login.vue";

export default Vue.extend({
  name: "HelloWorld",
  components: {Login},
  data: () => ({})
});
</script>
