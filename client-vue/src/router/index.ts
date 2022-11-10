import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import HomePrinterGrid from "@/views/PrinterGridView.vue";
import Printers from "@/views/PrintersView.vue";
import Settings from "@/views/SettingsView.vue";
import PrinterGroupsSettings from "@/views/settings/PrinterGroupsSettings.vue";
import About from "@/views/AboutView.vue";
import PrintTimeline from "@/views/PrintTimelineView.vue";
import FdmSettings from "@/views/settings/FdmSettings.vue";
import OtherSettings from "@/views/settings/OtherSettings.vue";
import UserManagementSettings from "@/views/settings/UserManagementSettings.vue";
import PrinterFloorSettings from "@/views/settings/PrinterFloorSettings.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Home",
    component: HomePrinterGrid,
  },
  {
    path: "/printers",
    name: "Printers",
    component: Printers,
  },
  {
    path: "/settings",
    component: Settings,
    children: [
      {
        path: "",
        redirect: "printer-groups",
      },
      {
        path: "printer-floors",
        component: PrinterFloorSettings,
      },
      {
        path: "user-management",
        component: UserManagementSettings,
      },
      {
        path: "printer-groups",
        component: PrinterGroupsSettings,
      },
      {
        path: "system",
        component: FdmSettings,
      },
      {
        path: "other",
        component: OtherSettings,
      },
    ],
  },
  {
    path: "/scheduling",
    name: "Print Timeline",
    component: PrintTimeline,
  },
  {
    path: "/about",
    name: "About",
    component: About,
  },
  {
    path: "*",
    name: "NotFound",
    component: () => import(/* webpackChunkName: "about" */ "../views/NotFoundView.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
