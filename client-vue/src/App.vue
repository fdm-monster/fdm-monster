<template>
  <v-app>
    <NavigationDrawer />
    <TopBar />

    <v-main>
      <ErrorAlert>
        <router-view />
      </ErrorAlert>
    </v-main>

    <UpdatePrinterDialog />
    <CreatePrinterDialog />
    <CreatePrinterGroupDialog />
    <CreatePrinterFloorDialog />
    <PrinterMaintenanceDialog />
    <FileExplorerSideNav />
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import NavigationDrawer from "@/components/Generic/NavigationDrawer.vue";
import TopBar from "@/components/Generic/TopBar.vue";
import ErrorAlert from "@/components/Generic/AlertStack.vue";
import UpdatePrinterDialog from "@/components/Generic/Dialogs/UpdatePrinterDialog.vue";
import FileExplorerSideNav from "@/components/Generic/SideNavs/FileExplorerSideNav.vue";
import CreatePrinterDialog from "@/components/Generic/Dialogs/CreatePrinterDialog.vue";
import CreatePrinterGroupDialog from "@/components/Generic/Dialogs/CreatePrinterGroupDialog.vue";
import CreatePrinterFloorDialog from "@/components/Generic/Dialogs/CreatePrinterFloorDialog.vue";
import PrinterMaintenanceDialog from "@/components/Generic/Dialogs/PrinterMaintenanceDialog.vue";
import { useOutletCurrentStore } from "@/store/outlet-current.store";
import { useUploadsStore } from "@/store/uploads.store";
import { usePrintersStore } from "@/store/printers.store";
import { useServerSettingsStore } from "@/store/server-settings.store";
import { SocketIoService } from "@/services/socketio.service";

interface Data {
  socketIoClient?: SocketIoService;
}

export default defineComponent({
  name: "AppView",
  components: {
    TopBar,
    NavigationDrawer,
    UpdatePrinterDialog,
    CreatePrinterDialog,
    CreatePrinterGroupDialog,
    CreatePrinterFloorDialog,
    PrinterMaintenanceDialog,
    FileExplorerSideNav,
    ErrorAlert,
  },
  setup: () => {
    return {
      uploadsStore: useUploadsStore(),
      printersStore: usePrintersStore(),
      outletCurrentStore: useOutletCurrentStore(),
      serverSettingsStore: useServerSettingsStore(),
    };
  },
  async created() {
    this.uploadsStore._injectEventBus(this.$bus);

    await this.serverSettingsStore.loadServerSettings();
    await this.connectSocketIoClient();
  },
  async mounted() {},
  beforeDestroy() {
    this.socketIoClient?.disconnect();
  },
  props: {},
  data: (): Data => ({
    socketIoClient: undefined,
  }),
  computed: {
    queuedUploads() {
      return this.uploadsStore.queuedUploads;
    },
  },
  methods: {
    async connectSocketIoClient() {
      this.socketIoClient = new SocketIoService();
      this.socketIoClient.setupSocketConnection(this.$bus);
    },
  },
  watch: {
    async queuedUploads() {
      await this.uploadsStore.handleNextUpload();
    },
  },
});
</script>

<style>
html {
  overflow-y: auto;
  background-color: #121212;
}
</style>
