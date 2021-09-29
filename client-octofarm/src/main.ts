import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import axios from "axios";
import VueAxios from "vue-axios";
import VueSSE from "vue-sse";
import { apiBase } from "@/backend/base.service";

Vue.config.productionTip = false;
Vue.use(VueAxios, axios);
Vue.use(VueSSE, {
  format: "json",
  polyfill: true,
  url: apiBase + "/printers/sse"
});

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App)
}).$mount("#app");
