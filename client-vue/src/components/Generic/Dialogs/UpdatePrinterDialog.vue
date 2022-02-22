<template>
  <v-dialog v-model="dialogShowed" :max-width="showChecksPanel ? '700px' : '600px'" persistent>
    <validation-observer ref="validationObserver" v-slot="{ invalid }">
      <v-card v-if="storedUpdatedPrinter">
        <v-card-title>
          <span class="text-h5">
            <v-avatar color="primary" size="56">
              {{ avatarInitials() }}
            </v-avatar>
            Updating Printer
          </span>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col :cols="showChecksPanel ? 8 : 12">
              <PrinterCrudForm ref="printerUpdateForm" :printer-id="storedUpdatedPrinter.id" />
            </v-col>

            <PrinterChecksPanel v-if="showChecksPanel" :cols="4" :test-progress="testProgress">
              <v-btn @click="showChecksPanel = false">Hide checks</v-btn>
            </PrinterChecksPanel>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <em class="red--text">* indicates required field</em>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDialog()">Close</v-btn>
          <v-btn :disabled="invalid" color="warning" text @click="testPrinter()">
            Test connection
          </v-btn>
          <v-btn :disabled="invalid" color="blue darken-1" text @click="submit()">Save</v-btn>
        </v-card-actions>
      </v-card>
    </validation-observer>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { ValidationObserver } from "vee-validate";
import { Printer } from "@/models/printers/printer.model";
import { sseTestPrinterUpdate } from "@/event-bus/sse.events";
import {
  PrinterSseMessage,
  TestProgressDetails
} from "@/models/sse-messages/printer-sse-message.model";
import { PrintersService } from "@/backend";
import { generateInitials } from "@/constants/noun-adjectives.data";
import { updatedPrinterEvent } from "@/event-bus/printer.events";
import PrinterChecksPanel from "@/components/Generic/Dialogs/PrinterChecksPanel.vue";
import { printersState } from "@/store/printers.state";
import PrinterCrudForm from "@/components/Generic/Forms/PrinterCrudForm.vue";
import { infoMessageEvent } from "@/event-bus/alert.events";

@Component({
  components: {
    ValidationObserver,
    PrinterCrudForm,
    PrinterChecksPanel
  },
  data: () => ({
    testProgress: undefined
  })
})
export default class UpdatePrinterDialog extends Vue {
  dialogShowed = false;

  showChecksPanel = false;
  testProgress?: TestProgressDetails = undefined;
  $refs!: {
    validationObserver: InstanceType<typeof ValidationObserver>;
    printerUpdateForm: InstanceType<typeof PrinterCrudForm>;
  };

  get storedUpdatedPrinter() {
    return printersState.currentUpdateDialogPrinter;
  }

  formData() {
    return this.$refs.printerUpdateForm?.formData;
  }

  @Watch("storedUpdatedPrinter")
  async inputUpdate(viewedPrinter?: Printer) {
    this.dialogShowed = !!viewedPrinter;
    const printerId = viewedPrinter?.id;
    if (!viewedPrinter || !printerId) return;

    const loginDetails = await PrintersService.getPrinterLoginDetails(printerId);
    const formData = this.formData();
    if (formData) formData.apiKey = loginDetails.apiKey;
  }

  @Watch("dialogShowed")
  updateStore(newVal: boolean) {
    // Due to the animation delay the nav model lags behind enough for SSE to pick up and override
    if (!newVal) {
      printersState.setUpdateDialogPrinter(undefined);
    }
  }

  async created() {
    window.addEventListener("keydown", (e) => {
      if (e.key == "Escape") {
        this.closeDialog();
      }
    });

    await printersState.loadPrinterGroups();
  }

  avatarInitials() {
    const formData = this.formData();
    if (formData && this.dialogShowed) {
      return generateInitials(formData.printerName);
    }
  }

  openTestPanel() {
    this.showChecksPanel = true;
    this.testProgress = undefined;
  }

  async onTestPrinterUpdate(payload: PrinterSseMessage) {
    this.testProgress = payload.testProgress;
  }

  async isValid() {
    return await this.$refs.validationObserver.validate();
  }

  async testPrinter() {
    if (!(await this.isValid())) return;

    const formData = this.formData();
    if (!formData) return;

    const testPrinter = PrintersService.convertCreateFormToPrinter(formData);
    if (!testPrinter) return;
    this.openTestPanel();

    const result: Printer = await printersState.createTestPrinter(testPrinter);
    if (!result.correlationToken) throw new Error("Test Printer CorrelationToken was empty.");

    this.$bus.on(sseTestPrinterUpdate(result.correlationToken), this.onTestPrinterUpdate);
  }

  async submit() {
    if (!(await this.isValid())) return;

    const formData = this.formData();
    if (!formData) return;

    const updatedPrinter = PrintersService.convertCreateFormToPrinter(formData);
    const printerId = updatedPrinter.id;

    const updatedData = await printersState.updatePrinter({
      printerId: printerId as string,
      updatedPrinter
    });

    this.$bus.emit(updatedPrinterEvent(printerId as string), updatedData);
    this.$bus.emit(infoMessageEvent, `Printer ${updatedPrinter.printerName} updated`);
  }

  closeDialog() {
    printersState.setUpdateDialogPrinter(undefined);
  }
}
</script>
