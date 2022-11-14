<template>
  <BaseDialog :id="dialogId" :max-width="'700px'">
    <validation-observer ref="validationObserver" v-slot="{ invalid }">
      <v-card>
        <v-card-title>
          <span class="text-h5">
            <v-avatar color="primary" size="56">
              {{ avatarInitials() }}
            </v-avatar>
            <span v-if="updatePrinterGroup"> Update Printer Group </span>
            <span v-else> New Printer Group </span>
          </span>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col :cols="12">
              <PrinterGroupCrudForm
                ref="printerGroupCrudForm"
                :printer-group-id="updatePrinterGroup?._id"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <em class="red--text">* indicates required field</em>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDialog()">Close</v-btn>
          <v-btn
            v-if="!updatePrinterGroup"
            :disabled="invalid"
            color="blue darken-1"
            text
            @click="submitCreate()"
          >
            Create
          </v-btn>
          <v-btn v-else :disabled="invalid" color="blue darken-1" text @click="submitUpdate()">
            Update
          </v-btn>
        </v-card-actions>
      </v-card>
    </validation-observer>
  </BaseDialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ValidationObserver } from "vee-validate";
import { PrinterGroupService } from "@/backend";
import { generateInitials } from "@/constants/noun-adjectives.data";
import { infoMessageEvent } from "@/event-bus/alert.events";
import PrinterGroupCrudForm from "@/components/Generic/Forms/PrinterGroupCrudForm.vue";
import { usePrintersStore } from "@/store/printers.store";
import { WithDialog } from "@/utils/dialog.utils";
import { DialogName } from "@/components/Generic/Dialogs/dialog.constants";
import { useDialogsStore } from "@/store/dialog.store";

type Data = WithDialog;

export default defineComponent({
  name: "CreatePrinterGroupDialog",
  components: {
    ValidationObserver,
    PrinterGroupCrudForm,
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
    dialogId: DialogName.CreatePrinterGroupDialog,
  }),
  computed: {
    updatePrinterGroup() {
      return this.printersStore.updateDialogPrinterGroup;
    },
    validationObserver() {
      return this.$refs.validationObserver as InstanceType<typeof ValidationObserver>;
    },
  },
  methods: {
    avatarInitials() {
      const formData = this.formData();
      if (formData) {
        return generateInitials(formData?.name);
      }
      return "";
    },
    printerGroupCrudForm() {
      return this.$refs.printerGroupCrudForm as InstanceType<typeof PrinterGroupCrudForm>;
    },
    formData() {
      return this.printerGroupCrudForm()?.formData;
    },
    async isValid() {
      return await this.validationObserver.validate();
    },
    async submitCreate() {
      if (!(await this.isValid())) return;
      const formData = this.formData();
      if (!formData) return;
      const newPrinterGroupData = PrinterGroupService.convertCreateFormToPrinterGroup(formData);
      await this.printersStore.createPrinterGroup(newPrinterGroupData);
      this.$bus.emit(infoMessageEvent, `Printer group ${newPrinterGroupData.name} created`);
      this.closeDialog();
    },
    async submitUpdate() {
      if (!(await this.isValid())) return;
      const formData = this.formData();
      if (!formData || !this.updatePrinterGroup?._id) return;
      const updatePrinterGroup = PrinterGroupService.convertCreateFormToPrinterGroup(formData);
      await this.printersStore.updatePrinterGroup({
        printerGroupId: this.updatePrinterGroup!._id!,
        updatePrinterGroup,
      });
      this.$bus.emit(infoMessageEvent, `Printer group ${updatePrinterGroup.name} updated`);

      this.closeDialog();
    },
    closeDialog() {
      this.dialogsStore.closeDialog(this.dialogId);
      this.printersStore.setUpdateDialogPrinterGroup();
    },
  },
  watch: {},
});
</script>
