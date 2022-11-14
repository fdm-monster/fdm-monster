import { defineStore } from "pinia";
import { DialogName } from "@/components/Generic/Dialogs/dialog.constants";

interface DialogReference {
  id: DialogName;
  opened: boolean;
}

interface State {
  dialogReferences: DialogReference[];
}

export const useDialogsStore = defineStore("Dialog", {
  state: (): State => ({
    dialogReferences: [],
  }),
  getters: {
    _getDialog(state) {
      return (id?: DialogName) => {
        return state.dialogReferences.find((dr) => dr.id === id);
      };
    },
    isDialogOpened() {
      return (id: DialogName) => {
        return this._getDialog(id)?.opened;
      };
    },
  },
  actions: {
    openDialog(id: DialogName) {
      let dialog = this._getDialog(id);
      if (!dialog) {
        dialog = this.registerDialogReference(id);
      }
      dialog.opened = true;
      console.log(`[Pinia Dialog ${id}] Opened`);
    },
    closeDialog(id: DialogName) {
      let dialog = this._getDialog(id);
      if (!dialog) {
        dialog = this.registerDialogReference(id);
      }
      dialog.opened = false;
      console.log(`[Pinia Dialog ${id}] Closed`);
    },
    unregisterDialogReference(id?: DialogName) {
      this.dialogReferences = this.dialogReferences.filter((dr) => dr.id === id);
    },
    registerDialogReference(id?: DialogName) {
      if (!id) throw new Error("Cannot unregister undefined dialog reference");

      const existingDialog = this._getDialog(id);
      if (existingDialog) {
        return existingDialog;
      }

      const dialogRef = {
        id,
        opened: false,
      };
      this.dialogReferences.push(dialogRef);
      return dialogRef;
    },
  },
});
