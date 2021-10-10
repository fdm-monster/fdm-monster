import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import vuetify from "./plugins/vuetify";
import axios from "axios";
import VueAxios from "vue-axios";
import VueSSE from "vue-sse";
import VueBus from "vue-bus";
import { apiBase } from "@/backend/base.service";
import { configureVeeValidate } from "@/plugins/veevalidate";
import { generateAppConstants } from "@/constants/app.constants";
import { registerFileDropDirective } from "@/directives/file-upload.directive";
import store from "@/store";

Vue.config.productionTip = false;
// Http Client
Vue.use(VueAxios, axios);
// Event Bus
Vue.use(VueBus);
// SSE Handler
Vue.use(VueSSE, {
  format: "json",
  polyfill: true,
  url: apiBase + "/api/printer/sse"
});

configureVeeValidate();
registerFileDropDirective();

Vue.config.errorHandler = (err: Error, vm: Vue, info: string) => {
  console.log("Global Error captured", err, vm, info);
};
new Vue({
  router,
  store,
  vuetify,
  provide: {
    appConstants: generateAppConstants()
  },
  render: (h) => h(App)
}).$mount("#app");
