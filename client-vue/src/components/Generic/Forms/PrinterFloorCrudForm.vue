<template>
  <v-container>
    <v-row>
      <v-col v-if="formData" cols="12" md="6">
        <validation-provider v-slot="{ errors }" :rules="printerGroupNameRules" name="Name">
          <v-text-field
            v-model="formData.name"
            :counter="printerGroupNameRules.max"
            :error-messages="errors"
            label="Floor name*"
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

        <!--        Maybe we'll add this in future -->
        <!--        <validation-provider v-slot="{ errors }" name="Groups">-->
        <!--          <v-select-->
        <!--            v-model="formData.printers"-->
        <!--            :error-messages="errors"-->
        <!--            :items="printersWithoutGroup"-->
        <!--            label="Printers"-->
        <!--            multiple-->
        <!--            no-data-text="No printers without group"-->
        <!--            required-->
        <!--          ></v-select>-->
        <!--        </validation-provider>-->
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

const watchedId = "printerId";

@Component({
  components: {
    ValidationProvider,
  },
  data: () => ({
    printersWithoutGroup: [],
  }),
})
export default class PrinterGroupCrudForm extends Vue {
  @Inject() readonly appConstants!: AppConstants;
  @Prop() printerGroupId: string;
  printersWithoutGroup: Printer[];
  formData?: PreCreatePrinterGroup = getDefaultCreatePrinterGroup();

  public get printerGroupNameRules() {
    return { required: true, max: this.appConstants.maxPrinterGroupNameLength };
  }

  public get locationXRules() {
    return {
      required: true,
      integer: true,
      max: this.appConstants.maxPrinterGroupLocationX,
    };
  }

  public get locationYRules() {
    return {
      required: true,
      integer: true,
      max: this.appConstants.maxPrinterGroupLocationY,
    };
  }

  get printerGroupNames() {
    return printersState.printerGroupNames;
  }

  async created() {
    if (this.printerGroupId) {
      const crudeData = this.$store.getters.printer(this.printerGroupId);
      this.formData = PrinterGroupService.convertPrinterGroupToCreateForm(crudeData);
    }

    await printersState.loadPrinterGroups();
  }

  @Watch(watchedId)
  onChildChanged(val?: string) {
    if (!val) return;

    const printerGroup = this.$store.getters.printerGroup(val) as PrinterGroup;

    // Inverse transformation
    this.formData = PrinterGroupService.convertPrinterGroupToCreateForm(printerGroup);
  }
}
</script>
