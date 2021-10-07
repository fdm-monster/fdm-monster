<template>
  <v-row justify="center">
    <v-dialog v-model="mutableShow" max-width="600px" persistent @keydown.esc="closeDialog()">
      <!--      <template v-slot:activator="{ on, attrs }">-->
      <!--        <v-btn v-bind="attrs" v-on="on" color="primary" dark> Open Dialog</v-btn>-->
      <!--      </template>-->
      <v-card>
        <v-card-title>
          <span class="text-h5">New Printer</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field label="Printer name*" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-select :items="['asd', '123']" label="Group(s)" multiple required></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  hint="Examples: 'my.printer.com' or '192.x.x.x'"
                  label="IP/Host*"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  hint="Global API Keys will be rejected!"
                  label="API Key*"
                  persistent-hint
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-checkbox label="Enabled*" :value="true" required></v-checkbox>
              </v-col>
            </v-row>

            <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-header>Advanced settings</v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-col cols="12" md="6">
                    <v-select :items="['http', 'https']" label="Insecure/Secure HTTP" value="http" required></v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select :items="['ws', 'wss']" label="Insecure/Secure Websocket" value="ws" required></v-select>
                  </v-col>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-container>
          <em class="red--text">* indicates required field</em>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDialog()"> Close</v-btn>
          <v-btn color="warning" text @click="closeDialog()"> Close</v-btn>
          <v-btn color="blue darken-1" text @click="closeDialog()"> Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script lang="ts">
// https://www.digitalocean.com/community/tutorials/vuejs-typescript-class-components
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class CreatePrinterDialog extends Vue {
  @Prop(Boolean) show: boolean;

  get mutableShow() {
    // https://forum.vuejs.org/t/update-data-when-prop-changes-data-derived-from-prop/1517/27
    return this.show;
  }

  set mutableShow(newValue: boolean) {
    this.$emit("update:show", newValue);
  }

  closeDialog() {
    this.mutableShow = false;
  }
}
</script>
