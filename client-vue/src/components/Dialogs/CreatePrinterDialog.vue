<template>
  <v-row justify="center">
    <v-dialog v-model="mutableShow" max-width="600px" persistent>
      <!--      <template v-slot:activator="{ on, attrs }">-->
      <!--        <v-btn v-bind="attrs" v-on="on" color="primary" dark> Open Dialog</v-btn>-->
      <!--      </template>-->
      <validation-observer ref="validationObserver" v-slot="{ invalid }">
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
                  <validation-provider v-slot="{ errors }" name="Groups">
                    <v-select
                      v-model="formData.groups"
                      :error-messages="errors"
                      :items="['asd', '123']"
                      label="Group(s)"
                      multiple
                      required
                    ></v-select>
                  </validation-provider>
                </v-col>
                <v-col cols="12" md="6">
                  <validation-provider
                    v-slot="{ errors }"
                    name="Printer IP or HostName"
                    rules="required|ip_or_fqdn"
                  >
                    <v-text-field
                      v-model="formData.printerHostName"
                      :error-messages="errors"
                      hint="Examples: 'my.printer.com', 'localhost' or '192.x.x.x'"
                      label="IP/Host*"
                    ></v-text-field>
                  </validation-provider>
                </v-col>
                <v-col cols="12" md="6">
                  <validation-provider
                    v-slot="{ errors }"
                    name="Host Port"
                    rules="required|integer|max:65535"
                  >
                    <v-text-field
                      v-model="formData.printerHostPort"
                      :error-messages="errors"
                      hint="Examples: '80', '443' or '5050'"
                      label="Host Port*"
                    ></v-text-field>
                  </validation-provider>
                </v-col>
                <v-col cols="12" md="6">
                  <validation-provider v-slot="{ errors }" name="Enabled">
                    <v-checkbox
                      v-model="formData.enabled"
                      :error-messages="errors"
                      hint="Disabling makes the printer passive"
                      label="Enabled*"
                      persistent-hint
                      required
                    ></v-checkbox>
                  </validation-provider>
                </v-col>
                <v-col cols="12" md="12">
                  <validation-provider v-slot="{ errors }" :rules="apiKeyRules" name="ApiKey">
                    <v-text-field
                      v-model="formData.apiKey"
                      :counter="apiKeyRules.length"
                      :error-messages="errors"
                      hint="User or Application Key only (Global API key fails)"
                      label="API Key*"
                      persistent-hint
                      required
                    ></v-text-field>
                  </validation-provider>
                </v-col>
              </v-row>

              <v-expansion-panels>
                <v-expansion-panel>
                  <v-expansion-panel-header>Advanced settings</v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <validation-provider v-slot="{ errors }" name="Display">
                      <v-checkbox
                        v-model="formData.display"
                        :error-messages="errors"
                        label="Display*"
                        required
                      ></v-checkbox>
                    </validation-provider>
                    <v-col cols="12" md="6">
                      <validation-provider v-slot="{ errors }" name="StepSize">
                        <v-select
                          v-model="formData.stepSize"
                          :error-messages="errors"
                          :items="[0.1, 1, 10, 100]"
                          label="Step-size for manual control"
                          required
                          value="http"
                        ></v-select>
                      </validation-provider>
                    </v-col>
                    <v-col cols="12" md="6">
                      <validation-provider v-slot="{ errors }" name="PrinterHostPrefix">
                        <v-select
                          v-model="formData.printerHostPrefix"
                          :error-messages="errors"
                          :items="['http', 'https']"
                          label="Insecure/Secure HTTP"
                          required
                          value="http"
                        ></v-select>
                      </validation-provider>
                    </v-col>
                    <v-col cols="12" md="6">
                      <validation-provider v-slot="{ errors }" name="WebsocketPrefix">
                        <v-select
                          v-model="formData.websocketPrefix"
                          :error-messages="errors"
                          :items="['ws', 'wss']"
                          label="Insecure/Secure Websocket"
                          required
                          value="ws"
                        ></v-select>
                      </validation-provider>
                    </v-col>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <em class="red--text">* indicates required field</em>
            <v-spacer></v-spacer>
            <v-btn text @click="closeDialog()"> Close</v-btn>
            <v-btn :disabled="invalid" color="warning" text @click="testPrinter()"
              >Test connection
            </v-btn>
            <v-btn :disabled="invalid" color="blue darken-1" text @click="submit()">Save</v-btn>
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
import { ValidationObserver, ValidationProvider } from "vee-validate";
import {
  CreatePrinter,
  defaultCreatePrinter,
  PreCreatePrinter
} from "@/models/printers/crud/create-printer.model";
import { ACTIONS } from "@/store/printers/printers.actions";
import { apiKeyLength } from "@/constants/validation.constants";
import { Action } from "vuex-class";
import { PrinterGroup } from "@/models/printers/printer-group.model";
import { Printer } from "@/models/printers/printer.model";
import { sseTestPrinterUpdate } from "@/event-bus/sse.events";

@Component({
  components: {
    ValidationProvider,
    ValidationObserver
  }
})
export default class CreatePrinterDialog extends Vue {
  @Prop(Boolean) show: boolean;
  @Action loadPrinterGroups: () => Promise<PrinterGroup[]>;

  formData: PreCreatePrinter = { ...defaultCreatePrinter };
  $refs!: {
    validationObserver: InstanceType<typeof ValidationObserver>;
  };

  apiKeyRules = { required: true, length: apiKeyLength };

  get mutableShow() {
    // https://forum.vuejs.org/t/update-data-when-prop-changes-data-derived-from-prop/1517/27
    return this.show;
  }

  set mutableShow(newValue: boolean) {
    this.$emit("update:show", newValue);
  }

  async created() {
    window.addEventListener("keydown", (e) => {
      if (e.key == "Escape") {
        this.closeDialog();
      }
    });

    await this.loadPrinterGroups();
  }

  async testPrinter() {
    const validationResult = await this.$refs.validationObserver.validate();

    if (!validationResult) return;

    const testPrinter = this.transformFormData();

    const result: Printer = await this.$store.dispatch(ACTIONS.createTestPrinter, testPrinter);
    if (!result.correlationToken) throw new Error("Test Printer CorrelationToken was empty.");

    this.$bus.on(sseTestPrinterUpdate(result.correlationToken), this.onTestPrinterUpdate);
  }

  async onTestPrinterUpdate(payload: Printer) {
    console.log(payload);
  }

  async submit() {
    const result = await this.$refs.validationObserver.validate();

    if (!result) return;

    const newPrinterData = this.transformFormData();

    await this.$store.dispatch(ACTIONS.createPrinter, newPrinterData);
  }

  clear() {
    this.formData = { ...defaultCreatePrinter };
    // this.$refs.observer.reset();
  }

  private transformFormData() {
    let modifiedData: any = { ...this.formData };

    const { printerHostPrefix, websocketPrefix, printerHostName, printerHostPort } = this.formData;
    const printerURL = new URL(`${printerHostPrefix}://${printerHostName}:${printerHostPort}`);
    const webSocketURL = new URL(`${websocketPrefix}://${printerHostName}:${printerHostPort}`);

    delete modifiedData.printerHostName;
    delete modifiedData.printerHostPrefix;
    delete modifiedData.websocketPrefix;
    modifiedData.printerURL = printerURL;
    modifiedData.webSocketURL = webSocketURL;

    return modifiedData as CreatePrinter;
  }

  private closeDialog() {
    this.mutableShow = false;
  }
}
</script>
