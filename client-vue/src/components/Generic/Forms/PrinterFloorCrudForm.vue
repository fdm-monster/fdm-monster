<template>
  <v-container>
    <v-row>
      <v-col v-if="formData" cols="12" md="6">
        <validation-provider v-slot="{ errors }" :rules="printerFloorNameRules" name="Name">
          <v-text-field
            v-model="formData.name"
            :error-messages="errors"
            label="Floor name*"
            required
          />
        </validation-provider>

        <validation-provider v-slot="{ errors }" :rules="floorNumberRules" name="LocationX">
          <v-text-field
            v-model="formData.floor"
            :error-messages="errors"
            label="Floor number"
            required
            type="number"
          />
        </validation-provider>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Inject, Prop, Watch } from "vue-property-decorator";
import { ValidationProvider } from "vee-validate";
import { AppConstants } from "@/constants/app.constants";
import { printersState } from "@/store/printers.state";
import { PrinterGroupService } from "@/backend";
import {
  getDefaultCreatePrinterGroup,
  PreCreatePrinterGroup,
} from "@/models/printer-groups/crud/create-printer-group.model";
import { PrinterGroup } from "@/models/printers/printer-group.model";
import { Printer } from "@/models/printers/printer.model";
import {
  getDefaultCreatePrinterFloor,
  PreCreatePrinterFloor,
  PrinterFloor,
} from "@/models/printer-floor/printer-floor.model";
import { PrinterFloorService } from "@/backend/printer-floor.service";

const watchedId = "printerFloorId";

@Component({
  components: {
    ValidationProvider,
  },
  data: () => ({
    printerGroupsWithoutFloor: [],
  }),
})
export default class PrinterFloorCrudForm extends Vue {
  @Inject() readonly appConstants!: AppConstants;
  @Prop() printerFloorId: string;
  printerGroupsWithoutFloor: PrinterGroup[];
  formData?: PreCreatePrinterFloor = getDefaultCreatePrinterFloor();

  public get printerFloorNameRules() {
    return { required: true, min: this.appConstants.minPrinterFloorNameLength };
  }

  public get floorNumberRules() {
    return {
      required: true,
      integer: true,
    };
  }

  get printerGroupNames() {
    return printersState.printerGroupNames;
  }

  async created() {
    if (this.printerFloorId) {
      const crudeData = printersState.printerFloor(this.printerFloorId);
      this.formData = PrinterFloorService.convertPrinterFloorToCreateForm(crudeData);
    }

    await printersState.loadPrinterGroups();
  }

  @Watch(watchedId)
  onChildChanged(val?: string) {
    if (!val) return;

    const printerFloor = printersState.printerFloor(val);

    // Inverse transformation
    this.formData = PrinterFloorService.convertPrinterFloorToCreateForm(printerFloor);
  }
}
</script>
