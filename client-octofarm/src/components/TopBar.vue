<template>
  <v-app-bar app color="primary" dark>
    <v-toolbar-title class="text-uppercase white--text">
      <span class="font-weight-light">MTB3D </span>
      <span>Printer Manager</span>
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <v-btn color="secondary" light>
      <span>Map</span>
      <v-icon right>location_on</v-icon>
    </v-btn>
    <v-btn color="secondary" dark>
      <span>Printers</span>
      <v-icon right>location_on</v-icon>
    </v-btn>
    <v-btn color="dark" dark>
      <span>Settings</span>
      <v-icon right>location_on</v-icon>
    </v-btn>

    <!--    <v-btn color="grey" dark>-->
    <!--      <span>Disconnect UART</span>-->
    <!--      <v-icon right>usb_off</v-icon>-->
    <!--    </v-btn>-->
  </v-app-bar>
</template>

<script>
export default {};
</script>
