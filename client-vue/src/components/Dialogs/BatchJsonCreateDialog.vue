<template>
  <v-row justify="center">
    <v-dialog v-model="mutableShow" :max-width="'600px'" persistent>
      <validation-observer ref="validationObserver" v-slot="{ invalid }">
        <v-card>
          <v-card-title>
            <span class="text-h5">
              <v-avatar color="primary" size="56"> . </v-avatar>
              Batch Import JSON printers
            </span>
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <validation-provider v-slot="{ errors }" name="JSON" rules="required|json">
                  <v-textarea
                    v-model="formData.json"
                    :error-messages="errors"
                    data-vv-validate-on="change|blur"
                  >
                    <template v-slot:label>
                      <div>JSON import <small>(optional)</small></div>
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
            <v-btn :disabled="invalid || true" color="blue darken-1" text @click="submit()">Create</v-btn>
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
import { extend, setInteractionMode, ValidationObserver, ValidationProvider } from "vee-validate";

setInteractionMode("eager");

extend("json", {
  validate: (value) => {
    try {
      JSON.parse(value);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  message: "{_field_} needs to be valid JSON."
});

@Component({
  components: {
    ValidationProvider,
    ValidationObserver
  }
})
export default class BatchJsonCreateDialog extends Vue {
  @Prop(Boolean) show: boolean;
  formData: any = {};
  numPrinters = 0;

  $refs!: {
    validationObserver: InstanceType<typeof ValidationObserver>;
  };

  get mutableShow() {
    // https://forum.vuejs.org/t/update-data-when-prop-changes-data-derived-from-prop/1517/27
    return this.show;
  }

  set mutableShow(newValue: boolean) {
    this.$emit("update:show", newValue);
  }

  async numberOfPrinters() {
    if (!this.$refs.validationObserver) return 0;
    if (!await this.isValid()) return 0;

    const data = JSON.parse(this.formData.json);
    if (!Array.isArray(data)) return 1;

    return data.length;
  }

  async created() {
    window.addEventListener("keydown", (e) => {
      if (e.key == "Escape") {
        this.closeDialog();
      }
    });

    this.numPrinters = await this.numberOfPrinters();
  }

  async isValid() {
    return await this.$refs.validationObserver.validate();
  }

  async submit() {
    if (!(await this.isValid())) return;

    const numPrinters = await this.numberOfPrinters();
    const answer = confirm(`Are you sure to import ${numPrinters} printers?`);

    if (answer) {
      console.log(this.formData);

    }

    this.closeDialog();
  }

  closeDialog() {
    this.mutableShow = false;
  }
}
</script>
