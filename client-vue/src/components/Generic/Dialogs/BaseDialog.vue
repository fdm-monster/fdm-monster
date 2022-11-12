<template>
  <v-dialog
    :value="showingDialog"
    :max-width="maxWidth"
    :retain-focus="false"
    persistent
    @close="closeDialog()"
  >
    <slot></slot>
  </v-dialog>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { usePrintersStore } from "@/store/printers.store";
import { useDialogsStore } from "@/store/dialog.store";
import { DialogName } from "@/components/Generic/Dialogs/dialog.constants";

export default defineComponent({
  name: "BaseDialog",
  components: {},
  setup: () => {
    return {
      printersStore: usePrintersStore(),
      dialogsStore: useDialogsStore(),
    };
  },
  async created() {
    window.addEventListener("keydown", (e) => {
      if (e.key == "Escape" && this.showingDialog) {
        this.closeDialog();
      }
    });
  },
  async mounted() {
    this.dialogsStore.registerDialogReference(this.id);
  },
  beforeDestroy() {
    this.dialogsStore.unregisterDialogReference(this.id);
  },
  props: {
    id: {
      type: String as () => DialogName,
      required: true,
    },
    maxWidth: {
      type: String,
      default: "400px",
    },
  },
  computed: {
    showingDialog() {
      if (!this.id) return;

      return this.dialogsStore.isDialogOpened(this.id);
    },
  },
  methods: {
    closeDialog() {
      console.log(`[BaseDialog ${this.id}] Close triggered`);
      this.dialogsStore.closeDialog(this.id);
    },
  },
  watch: {},
});
</script>
