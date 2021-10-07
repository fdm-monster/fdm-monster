<template>
  <v-row justify="center">
    <v-dialog v-model="mutableShow" max-width="600px" persistent @keydown.esc="closeDialog()">
      <!--      <template v-slot:activator="{ on, attrs }">-->
      <!--        <v-btn v-bind="attrs" v-on="on" color="primary" dark> Open Dialog</v-btn>-->
      <!--      </template>-->
      <validation-observer ref="observer" v-slot="{ invalid }">
        <v-card>
          <v-card-title>
            <span class="text-h5">New Printer</span>
          </v-card-title>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="12" md="6">
                  <validation-provider v-slot="{ errors }" name="Name" rules="required|max:10">
                    <v-text-field
                      v-model="formData.printerName"
                      :error-messages="errors"
                      label="Printer name*"
                      required
                    />
                  </validation-provider>
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
                  <v-checkbox :value="true" label="Enabled*" required></v-checkbox>
                </v-col>
              </v-row>

              <v-expansion-panels>
                <v-expansion-panel>
                  <v-expansion-panel-header>Advanced settings</v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-col cols="12" md="6">
                      <v-select
                        :items="['http', 'https']"
                        label="Insecure/Secure HTTP"
                        required
                        value="http"
                      ></v-select>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        :items="['ws', 'wss']"
                        label="Insecure/Secure Websocket"
                        required
                        value="ws"
                      ></v-select>
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
            <v-btn color="warning" text @click="testPrinter()">Test</v-btn>
            <v-btn :disabled="invalid" color="blue darken-1" text @click="closeDialog()"
              >Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </validation-observer>
    </v-dialog>
  </v-row>
</template>

<script lang="ts">
// https://www.digitalocean.com/community/tutorials/vuejs-typescript-class-components
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { extend, setInteractionMode, ValidationObserver, ValidationProvider } from "vee-validate";
import { CreatePrinter, defaultCreatePrinter } from "@/models/printers/crud/create-printer.model";
import { digits, max, required } from "vee-validate/dist/rules";

setInteractionMode("eager");

extend("digits", {
  ...digits,
  message: "{_field_} needs to be {length} digits. ({_value_})"
});

extend("required", {
  ...required,
  message: "{_field_} can not be empty"
});

extend("max", {
  ...max,
  message: "{_field_} may not be greater than {length} characters"
});

@Component({
  components: {
    ValidationProvider,
    ValidationObserver
  }
})
export default class CreatePrinterDialog extends Vue {
  @Prop(Boolean) show: boolean;
  formData: CreatePrinter = { ...defaultCreatePrinter };

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

  testPrinter() {
    // console.log(this.$refs.printerCreateForm.validate());
  }

  submit() {
    // this.$refs.observer.validate();
  }

  clear() {
    this.formData = { ...defaultCreatePrinter };
    // this.$refs.observer.reset();
  }
}
</script>
