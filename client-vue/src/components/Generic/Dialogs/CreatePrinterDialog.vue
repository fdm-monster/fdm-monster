<template>
  <BaseDialog :id="dialogId" :max-width="showChecksPanel ? '700px' : '600px'">
    <validation-observer ref="validationObserver" v-slot="{ invalid }">
      <v-card>
        <v-card-title>
          <span class="text-h5">
            <v-avatar color="primary" size="56">
              {{ avatarInitials() }}
            </v-avatar>
            New Printer
          </span>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col :cols="showChecksPanel ? 8 : 12">
              <PrinterCrudForm ref="printerCrudForm" @onChange="onFormChange" />
            </v-col>

            <PrinterChecksPanel v-if="showChecksPanel" :cols="4" :test-progress="testProgress">
              <v-btn @click="showChecksPanel = false">Hide checks</v-btn>
            </PrinterChecksPanel>
          </v-row>
          <v-row>
            <v-col v-if="!isClipboardApiAvailable()" cols="12">
              Clipboard is not available. Copy or paste the following:
              <br />
              <v-textarea v-model="copyPasteConnectionString" rows="3"></v-textarea>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <em class="red--text">* indicates required field</em>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDialog()">Close</v-btn>
          <v-btn :disabled="isPasteDisabled()" text @click="pasteFromClipboardOrField()">
            Paste
          </v-btn>
          <v-btn :disabled="invalid" color="warning" text @click="testPrinter()">
            Test connection
          </v-btn>
          <v-btn :disabled="invalid" color="blue darken-1" text @click="submit()">Create</v-btn>
        </v-card-actions>
      </v-card>
    </validation-observer>
  </BaseDialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ValidationObserver } from "vee-validate";
import { generateInitials } from "@/constants/noun-adjectives.data";
import { infoMessageEvent } from "@/event-bus/alert.events";
import { usePrintersStore } from "@/store/printers.store";
import { Printer } from "@/models/printers/printer.model";
import { sseTestPrinterUpdate } from "@/event-bus/sse.events";
import {
  SocketIoTestPrinterMessage,
  TestProgressDetails,
} from "@/models/sse-messages/printer-sse-message.model";
import { PrintersService } from "@/backend";
import PrinterChecksPanel from "@/components/Generic/Dialogs/PrinterChecksPanel.vue";
import PrinterCrudForm from "@/components/Generic/Forms/PrinterCrudForm.vue";
import { WithDialog } from "@/utils/dialog.utils";
import { DialogName } from "@/components/Generic/Dialogs/dialog.constants";
import { useDialogsStore } from "@/store/dialog.store";

interface Data extends WithDialog {
  showChecksPanel: boolean;
  copyPasteConnectionString: string;
  testProgress?: TestProgressDetails;
}

export default defineComponent({
  name: "CreatePrinterDialog",
  components: {
    ValidationObserver,
    PrinterCrudForm,
    PrinterChecksPanel,
  },
  setup: () => {
    return {
      printersStore: usePrintersStore(),
      dialogsStore: useDialogsStore(),
    };
  },
  async created() {},
  async mounted() {},
  props: {},
  data: (): Data => ({
    testProgress: undefined,
    showChecksPanel: false,
    copyPasteConnectionString: "",
    dialogId: DialogName.CreatePrinterDialog,
  }),
  computed: {
    validationObserver() {
      return this.$refs.validationObserver as InstanceType<typeof ValidationObserver>;
    },
    dialogOpenedState() {
      return this.dialogsStore.isDialogOpened(this.dialogId);
    },
  },
  methods: {
    printerCrudForm() {
      return this.$refs.printerCrudForm as InstanceType<typeof PrinterCrudForm>;
    },
    formData() {
      return this.printerCrudForm()?.formData;
    },
    avatarInitials() {
      const formData = this.formData();
      if (formData) {
        return generateInitials(formData?.printerName);
      }
    },
    openTestPanel() {
      this.showChecksPanel = true;
      this.testProgress = undefined;
    },
    async onTestPrinterUpdate(payload: SocketIoTestPrinterMessage) {
      this.testProgress = payload.testProgress;
    },
    async testPrinter() {
      if (!(await this.isValid())) return;

      this.openTestPanel();
      const formData = this.formData();
      if (!formData) return;
      const testPrinter = PrintersService.convertCreateFormToPrinter(formData);
      const result: Printer = await this.printersStore.createTestPrinter(testPrinter);
      if (!result.correlationToken) throw new Error("Test Printer CorrelationToken was empty.");
      this.$bus.on(sseTestPrinterUpdate(result.correlationToken), this.onTestPrinterUpdate);
    },
    isPasteDisabled() {
      if (!this.isClipboardApiAvailable()) {
        return !this.copyPasteConnectionString?.length;
      }
      return false;
    },
    async pasteFromClipboardOrField() {
      const formData = this.formData();
      if (!formData) return;

      if (!this.isClipboardApiAvailable() && !this.copyPasteConnectionString?.length) {
        return;
      }

      const jsonData = this.isClipboardApiAvailable()
        ? await navigator.clipboard.readText()
        : this.copyPasteConnectionString;
      const printerObject = JSON.parse(jsonData);

      PrintersService.applyLoginDetailsPatchForm(printerObject, formData);
    },
    async isValid() {
      return await this.validationObserver.validate();
    },
    async submit() {
      if (!(await this.isValid())) return;
      const formData = this.formData();
      if (!formData) return;
      const newPrinterData = PrintersService.convertCreateFormToPrinter(formData);
      await this.printersStore.createPrinter(newPrinterData);
      this.$bus.emit(infoMessageEvent, `Printer ${newPrinterData.printerName} created`);
      this.printerCrudForm().resetForm();
      this.validationObserver.reset();
      this.closeDialog();
    },
    closeDialog() {
      this.dialogsStore.closeDialog(this.dialogId);
      this.copyPasteConnectionString = "";
    },
    isClipboardApiAvailable() {
      return navigator.clipboard;
    },
  },
  watch: {
    dialogOpenedState(newValue: boolean) {
      this.testProgress = undefined;
    },
  },
});
</script>
