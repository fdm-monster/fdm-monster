<template>
  <v-dialog v-model="showingDialog" :max-width="'700px'" persistent>
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
          <!--          Might be used later if problems arise-->
          <!--          <v-btn :disabled="invalid" color="warning" text @click="validateGroup()">-->
          <!--            Validate-->
          <!--          </v-btn>-->
          <v-btn :disabled="invalid" color="blue darken-1" text @click="submit()">Create</v-btn>
        </v-card-actions>
      </v-card>
    </validation-observer>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { ValidationObserver } from "vee-validate";
import { generateInitials } from "@/constants/noun-adjectives.data";
import { printersState } from "@/store/printers.state";
import { infoMessageEvent } from "@/event-bus/alert.events";
import PrinterFloorCrudForm from "@/components/Generic/Forms/PrinterFloorCrudForm.vue";
import { PrinterFloorService } from "@/backend/printer-floor.service";

@Component({
  components: {
    PrinterFloorCrudForm,
    ValidationObserver,
  },
  data: () => ({}),
})
export default class CreatePrinterFloorDialog extends Vue {
  showingDialog = false;

  showChecksPanel = false;
  $refs!: {
    validationObserver: InstanceType<typeof ValidationObserver>;
    printerFloorCrudForm: InstanceType<typeof PrinterFloorCrudForm>;
  };

  get dialogOpenedState() {
    return printersState.createFloorDialogOpened;
  }

  @Watch("dialogOpenedState")
  changeDialogOpened(newValue: boolean) {
    this.showingDialog = newValue;
  }

  formData() {
    return this.$refs.printerFloorCrudForm?.formData;
  }

  async created() {
    window.addEventListener("keydown", (e) => {
      if (e.key == "Escape") {
        this.closeDialog();
      }
    });
  }

  avatarInitials() {
    const formData = this.formData();
    if (formData && this.showingDialog) {
      return generateInitials(formData.name);
    }
  }

  async isValid() {
    return await this.$refs.validationObserver.validate();
  }

  async submit() {
    if (!(await this.isValid())) return;

    const formData = this.formData();
    if (!formData) return;
    const newPrinterFloorData = PrinterFloorService.convertCreateFormToPrinterFloor(formData);

    await printersState.createPrinterFloor(newPrinterFloorData);

    this.$bus.emit(infoMessageEvent, `Printer floor ${newPrinterFloorData.name} created`);

    this.closeDialog();
  }

  closeDialog() {
    printersState.setCreateFloorDialogOpened(false);
  }
}
</script>
