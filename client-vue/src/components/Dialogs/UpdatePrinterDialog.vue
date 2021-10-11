<template>
  <v-row justify="center">
    <v-dialog v-model="mutableShow" :max-width="showChecksPanel ? '700px' : '600px'" persistent>
      <validation-observer ref="validationObserver" v-slot="{ invalid }">
        <v-card>
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
                <PrinterCrudForm ref="printerUpdateForm" :printer-id="printerId" />
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
  </v-row>
</template>

<script lang="ts">
// https://www.digitalocean.com/community/tutorials/vuejs-typescript-class-components
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ValidationObserver } from "vee-validate";
import { Printer } from "@/models/printers/printer.model";
import { sseTestPrinterUpdate } from "@/event-bus/sse.events";
import { PrinterSseMessage, TestProgressDetails } from "@/models/sse-messages/printer-sse-message.model";
import { PrintersService } from "@/backend";
import { generateInitials } from "@/constants/noun-adjectives.data";
import { updatedPrinterEvent } from "@/event-bus/printer.events";
import PrinterChecksPanel from "@/components/Dialogs/PrinterChecksPanel.vue";
import { printersState } from "@/store/printers.state";
import PrinterCrudForm from "@/components/Forms/PrinterCrudForm.vue";
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
  @Prop() printerId: string; // Watched
  @Prop() show: boolean;

  showChecksPanel = false;
  testProgress?: TestProgressDetails = undefined;
  $refs!: {
    validationObserver: InstanceType<typeof ValidationObserver>;
    printerUpdateForm: InstanceType<typeof PrinterCrudForm>;
  };

  formData() {
    return this.$refs.printerUpdateForm?.formData;
  }

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

    await printersState.loadPrinterGroups();
  }

  avatarInitials() {
    const formData = this.formData();
    if (formData && this.show) {
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

    const testPrinter = PrintersService.convertCreateFormToPrinter(this.formData());
    this.openTestPanel();

    const result: Printer = await printersState.createTestPrinter(testPrinter);
    if (!result.correlationToken) throw new Error("Test Printer CorrelationToken was empty.");

    this.$bus.on(sseTestPrinterUpdate(result.correlationToken), this.onTestPrinterUpdate);
  }

  async submit() {
    if (!(await this.isValid())) return;

    const updatedPrinter = PrintersService.convertCreateFormToPrinter(this.formData());
    const printerId = updatedPrinter.id;

    const updatedData = await printersState.updatePrinter({
      printerId: printerId as string,
      updatedPrinter
    });

    this.$bus.emit(updatedPrinterEvent(printerId as string), updatedData);
    this.$bus.emit(infoMessageEvent, `Printer ${updatedPrinter.printerName} updated`);
  }

  closeDialog() {
    this.mutableShow = false;
  }
}
</script>
