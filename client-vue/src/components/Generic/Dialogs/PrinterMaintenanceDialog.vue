<template>
  <v-dialog v-model="dialogShowed" :max-width="'600px'" persistent>
    <validation-observer ref="validationObserver" v-slot="{ invalid }">
      <v-card>
        <v-card-title>
          <span class="text-h5"> Mark printer for maintenance </span>
        </v-card-title>
        <v-alert color="secondary"> Keep this short so it fits on a Print Tile</v-alert>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="selectedQuickItems"
                :chips="true"
                :items="quickItems"
                clearable
                color="primary"
                multiple
                placeholder="Quick select reason"
                @change="updateText()"
              ></v-select>
              <validation-provider v-slot="{ errors }" name="JSON" rules="required">
                <v-textarea
                  v-model="formData.disabledReason"
                  :error-messages="errors"
                  data-vv-validate-on="change|blur"
                >
                  <template v-slot:label>
                    <div>Type the reason*</div>
                  </template>
                </v-textarea>
              </validation-provider>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <em class="red--text">* indicates required field</em>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDialog()">Close</v-btn>
          <v-btn :disabled="invalid" color="blue darken-1" text @click="submit()">Save</v-btn>
        </v-card-actions>
      </v-card>
    </validation-observer>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ValidationObserver, ValidationProvider } from "vee-validate";
import { PrintersService } from "@/backend";
import { Printer } from "@/models/printers/printer.model";
import { usePrintersStore } from "@/store/printers.store";

interface Data {
  dialogShowed: boolean;
  selectedQuickItems: string[];
  quickItems: string[];
  formData: any;
}

export default defineComponent({
  name: "UpdatePrinterDialog",
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  setup: () => {
    return {
      printersStore: usePrintersStore(),
    };
  },
  async created() {
    window.addEventListener("keydown", (e) => {
      if (e.key == "Escape") {
        this.closeDialog();
      }
    });
  },
  async mounted() {},
  props: {},
  data: (): Data => ({
    dialogShowed: false,
    selectedQuickItems: [],
    quickItems: [
      "Cable USB ",
      "Cable Heatbed",
      "Thermistor Heatbed",
      "Thermistor Heatblock",
      "Mintemp",
      "Thermal Runaway",
      "Mintemp Nozzle",
      "Mintemp Heatbed",
      "Nozzle",
      "Nozzle Clog",
      "Fan Hotend",
      "Fan Part cooling",
      "Extruder rattle",
      "Extruder",
      "Z Axis",
      "X Axis",
      "Y Axis",
      "Rented",
      "Rambo",
      "Other",
      "Clean",
    ],
    formData: {},
  }),
  computed: {
    validationObserver() {
      return this.$refs.validationObserver as InstanceType<typeof ValidationObserver>;
    },
    printer() {
      return this.printersStore.maintenanceDialogPrinter;
    },
  },
  methods: {
    async isValid() {
      return await this.validationObserver.validate();
    },
    updateText() {
      this.formData.disabledReason = this.selectedQuickItems.join(", ");
    },
    async submit() {
      if (!(await this.isValid())) return;

      const printerId = this.printer?.id;
      if (!printerId) {
        this.formData = {};
        this.closeDialog();
        return;
      }

      const disabledReason = this.formData.disabledReason;
      await PrintersService.updatePrinterMaintenance(printerId, disabledReason);

      this.formData = {};
      this.closeDialog();
    },
    closeDialog() {
      this.printersStore.setMaintenanceDialogPrinter();
    },
  },
  watch: {
    async printer(viewedPrinter?: Printer, oldVal?: Printer) {
      this.dialogShowed = !!viewedPrinter;
      const printerId = viewedPrinter?.id;
      if (!viewedPrinter || !printerId) return;
    },
  },
});
</script>
