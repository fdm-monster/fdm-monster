import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import HomePage from "@/views/HomePage.vue";
import Printers from "@/views/Printers.vue";
import Settings from "@/views/Settings.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Home",
    component: HomePage
  },
  {
    path: "/printers",
    name: "Printers",
    component: Printers
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings
  },
  {
    path: "*",
    name: "NotFound",
    component: () => import(/* webpackChunkName: "about" */ "../views/NotFound.vue")
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
