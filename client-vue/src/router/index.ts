import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import HomePage from "@/views/HomePage.vue";
import Printers from "@/views/Printers.vue";
import Settings from "@/views/Settings.vue";
import About from "@/views/About.vue";
import Scheduling from "@/views/Scheduling.vue";

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
    path: "/scheduling",
    name: "Scheduling",
    component: Scheduling
  },
  {
    path: "/about",
    name: "About",
    component: About
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
