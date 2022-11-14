<template>
  <v-container>
    <v-row>
      <v-col v-if="formData" cols="12" md="6">
        <validation-provider v-slot="{ errors }" :rules="printerGroupNameRules" name="Name">
          <v-text-field
            v-model="formData.name"
            :counter="printerGroupNameRules.max"
            :error-messages="errors"
            autofocus
            label="Printer name*"
            required
          />
        </validation-provider>

        <validation-provider v-slot="{ errors }" :rules="locationXRules" name="LocationX">
          <v-text-field
            v-model="formData.location.x"
            :counter="locationXRules.max"
            :error-messages="errors"
            label="Location X"
            required
            type="number"
          />
        </validation-provider>

        <validation-provider v-slot="{ errors }" :rules="locationYRules" name="LocationY">
          <v-text-field
            v-model="formData.location.y"
            :counter="locationYRules.max"
            :error-messages="errors"
            label="Location Y*"
            required
            type="number"
          />
        </validation-provider>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { ValidationProvider } from "vee-validate";
import { AppConstants } from "@/constants/app.constants";
import { PrinterGroupService } from "@/backend";
import {
  getDefaultCreatePrinterGroup,
  PreCreatePrinterGroup,
} from "@/models/printer-groups/crud/create-printer-group.model";
import { PrinterGroup } from "@/models/printer-groups/printer-group.model";
import { usePrintersStore } from "@/store/printers.store";

interface Data {
  formData?: PreCreatePrinterGroup;
}

const watchedId = "printerGroupId";

export default defineComponent({
  name: "PrinterGroupCrudForm",
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
    if (this.printerGroupId) {
      const crudeData = this.printersStore.printerGroup(this.printerGroupId);
      this.formData = PrinterGroupService.convertPrinterGroupToCreateForm(crudeData);
    }
    await this.printersStore.loadPrinterGroups();
  },
  async mounted() {},
  props: {
    printerGroupId: String,
  },
  data: (): Data => ({
    formData: getDefaultCreatePrinterGroup(),
  }),
  computed: {
    printerGroupNameRules() {
      return { required: true, max: this.appConstants.maxPrinterGroupNameLength };
    },
    locationXRules() {
      return {
        required: true,
        integer: true,
        max: this.appConstants.maxPrinterGroupLocationX,
      };
    },
    locationYRules() {
      return {
        required: true,
        integer: true,
        max: this.appConstants.maxPrinterGroupLocationY,
      };
    },
    printerGroupNames() {
      return this.printersStore.printerGroupNames;
    },
  },
  methods: {},
  watch: {
    [watchedId](val?: string) {
      if (!val) return;

      // Inverse transformation
      const printerGroup = this.printersStore.printerGroup(val) as PrinterGroup;
      this.formData = PrinterGroupService.convertPrinterGroupToCreateForm(printerGroup);
    },
  },
});
</script>
