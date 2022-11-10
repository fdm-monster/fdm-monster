<template>
  <v-dialog v-model="dialogShowed" :max-width="'700px'" persistent>
    <validation-observer ref="validationObserver" v-slot="{ invalid }">
      <v-card>
        <v-card-title>
          <span class="text-h5">
            <v-avatar color="primary" size="56">
              {{ avatarInitials() }}
            </v-avatar>
            New Printer Floor
          </span>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col :cols="12">
              <PrinterFloorCrudForm ref="printerFloorCrudForm" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <em class="red--text">* indicates required field</em>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDialog()">Close</v-btn>
          <v-btn :disabled="invalid" color="blue darken-1" text @click="submit()">Create</v-btn>
        </v-card-actions>
      </v-card>
    </validation-observer>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ValidationObserver } from "vee-validate";
import { generateInitials, newRandomNamePair } from "@/constants/noun-adjectives.data";
import { infoMessageEvent } from "@/event-bus/alert.events";

import { usePrintersStore } from "@/store/printers.store";
import PrinterFloorCrudForm from "@/components/Generic/Forms/PrinterFloorCrudForm.vue";
import { PrinterFloorService } from "@/backend/printer-floor.service";

interface Data {
  dialogShowed: boolean;
}

export default defineComponent({
  name: "CreatePrinterFloorDialog",
  components: {
    ValidationObserver,
    PrinterFloorCrudForm,
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
  }),
  computed: {
    validationObserver() {
      return this.$refs.validationObserver as InstanceType<typeof ValidationObserver>;
    },
    printerFloorCrudForm() {
      return this.$refs.printerFloorCrudForm as InstanceType<typeof PrinterFloorCrudForm>;
    },
    formData() {
      return this.printerFloorCrudForm?.formData;
    },
    dialogOpenedState() {
      return this.printersStore.createFloorDialogOpened;
    },
  },
  methods: {
    avatarInitials() {
      if (this.formData && this.dialogShowed) {
        return generateInitials(this.formData.name);
      }
    },
    async isValid() {
      return await this.validationObserver.validate();
    },
    async submit() {
      if (!(await this.isValid())) return;
      if (!this.formData) return;
      const newPrinterFloorData = PrinterFloorService.convertCreateFormToPrinterFloor(
        this.formData
      );
      await this.printersStore.createPrinterFloor(newPrinterFloorData);

      this.$bus.emit(infoMessageEvent, `Printer floor ${newPrinterFloorData.name} created`);
      this.formData.name = newRandomNamePair();
      const maxIndex = Math.max(...this.printersStore.printerFloors.map((pf) => pf.floor)) + 1;
      this.formData.floor = maxIndex.toString();
      this.closeDialog();
    },
    closeDialog() {
      this.printersStore.setCreateFloorDialogOpened(false);
    },
  },
  watch: {
    dialogShowed(newVal: boolean) {
      this.dialogShowed = newVal;
    },
  },
});
</script>
