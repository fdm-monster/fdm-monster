<template>
  <v-container>
    <v-row>
      <v-col v-if="formData" cols="12" md="6">
        <validation-provider v-slot="{ errors }" :rules="printerNameRules" name="Name">
          <v-text-field
            v-model="formData.printerName"
            :counter="printerNameRules.max"
            :error-messages="errors"
            autofocus
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
          <!-- TODO Groups not defined -->
          <v-select
            v-model="formData.groups"
            :error-messages="errors"
            :items="printerGroupNames"
            disabled
            label="Groups"
            multiple
            no-data-text="No groups known"
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
import { defineComponent, inject } from "vue";
import { ValidationProvider } from "vee-validate";
import { AppConstants } from "@/constants/app.constants";
import {
  CreatePrinter,
  getDefaultCreatePrinter,
  PreCreatePrinter,
} from "@/models/printers/crud/create-printer.model";
import { PrintersService } from "@/backend";
import { usePrintersStore } from "@/store/printers.store";

const watchedId = "printerId";

interface Data {
  formData: PreCreatePrinter;
}

export default defineComponent({
  name: "PrinterCrudForm",
  components: {
    ValidationProvider,
  },
  setup: () => {
    return {
      printersStore: usePrintersStore(),
      appConstants: inject("appConstants") as AppConstants,
    };
  },
  async created() {
    if (this.printerId) {
      const crudeData = this.printersStore.printer(this.printerId) as CreatePrinter;
      this.formData = PrintersService.convertPrinterToCreateForm(crudeData);
    }

    await this.printersStore.loadPrinterGroups();
  },
  async mounted() {},
  props: {
    printerId: String,
  },
  data: (): Data => ({
    formData: getDefaultCreatePrinter(),
  }),
  computed: {
    printerGroupNames() {
      return this.printersStore.printerGroupNames;
    },
    printerNameRules() {
      return { required: true, max: this.appConstants.maxPrinterNameLength };
    },
    apiKeyRules() {
      return {
        required: true,
        length: this.appConstants.apiKeyLength,
        alpha_num: true,
      };
    },
  },
  methods: {
    resetForm() {
      this.formData = getDefaultCreatePrinter();
    },
  },
  watch: {
    [watchedId](val?: string) {
      if (!val) return;
      const printer = this.printersStore.printer(val) as CreatePrinter;
      this.formData = PrintersService.convertPrinterToCreateForm(printer);
    },
  },
});
</script>
