<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <validation-provider v-slot="{ errors }" :rules="printerNameRules" name="Name">
          <v-text-field
            v-model="formData.printerName"
            :counter="printerNameRules.max"
            :error-messages="errors"
            label="Printer name*"
            required
          />
        </validation-provider>

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

        <validation-provider v-slot="{ errors }" name="Groups">
          <v-select
            v-model="formData.groups"
            :error-messages="errors"
            :items="printerGroupNames"
            no-data-text="No groups known"
            label="Groups"
            multiple
            required
          ></v-select>
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
      <v-col class="pb-5 pt-0" cols="12" md="12">
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

    <v-expansion-panels accordion>
      <v-expansion-panel>
        <v-expansion-panel-header>Advanced settings</v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-col cols="12" md="12">
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
            <validation-provider v-slot="{ errors }" name="Display">
              <v-checkbox
                v-model="formData.display"
                :error-messages="errors"
                disabled
                label="Display*"
                required
              ></v-checkbox>
            </validation-provider>
          </v-col>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { ValidationProvider } from "vee-validate";
import Vue from "vue";
import { Inject, Prop, Watch } from "vue-property-decorator";
import { AppConstants } from "@/constants/app.constants";
import {
  getDefaultCreatePrinter,
  PreCreatePrinter
} from "@/models/printers/crud/create-printer.model";
import { printersState } from "@/store/printers.state";
import { PrintersService } from "@/backend";
import { Printer } from "@/models/printers/printer.model";

const watchedId = "printerId";

@Component({
  components: {
    ValidationProvider
  },
  data: () => ({
    testProgress: undefined
  })
})
export default class PrinterCrudForm extends Vue {
  @Inject() readonly appConstants!: AppConstants;
  @Prop() printerId: string;

  apiKeyRules = { required: true, length: this.appConstants.apiKeyLength, alpha_num: true };
  printerNameRules = { required: true, max: this.appConstants.maxPrinterNameLength };
  formData: PreCreatePrinter = getDefaultCreatePrinter();

  get printerGroupNames() {
    return printersState.printerGroupNames;
  }

  async created() {
    if (this.printerId) {
      const crudeData = this.$store.getters.printer(this.printerId);
      this.formData = PrintersService.convertPrinterToCreateForm(crudeData);
    }

    await printersState.loadPrinterGroups();
  }

  @Watch(watchedId)
  onChildChanged(val?: string, oldVal?: string) {
    if (!val) return;

    const printer = this.$store.getters.printer(val) as Printer;

    // Inverse transformation
    this.formData = PrintersService.convertPrinterToCreateForm(printer);
  }
}
</script>
