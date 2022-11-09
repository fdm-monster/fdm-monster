import Vue from "vue";
import App from "./App.vue";
import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/tracing";

// import "./registerServiceWorker";
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
import { vuexErrorEvent } from "@/event-bus/alert.events";
import { PiniaVuePlugin, createPinia } from "pinia";

Vue.config.productionTip = false;
// Http Client
Vue.use(VueAxios, axios);
// Event Bus
Vue.use(VueBus);
// SSE Handler
Vue.use(VueSSE, {
  format: "json",
  polyfill: true,
  url: apiBase + "/api/printer/sse",
});

configureVeeValidate();
registerFileDropDirective();

window.addEventListener("unhandledrejection", (event) => {
  if (event.reason?.isAxiosError) {
    console.warn(`Handled error through alert`, event.reason);
  }
  Vue.bus.emit(vuexErrorEvent, event);
  event.preventDefault();
});

Sentry.init({
  Vue,
  dsn: "https://f64683e8d1cb4ac291434993cff1bf9b@o4503975545733120.ingest.sentry.io/4503975546912768",
  integrations: [
    new BrowserTracing({
      routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      tracingOrigins: ["localhost", "my-site-url.com", /^\//],
    }),
  ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

// Not sure how this works with Sentry
// Vue.config.errorHandler = (err: Error, vm: Vue, info: string) => {
//   console.log("Global Error captured", err, vm, info);
// };

Vue.use(PiniaVuePlugin);
const pinia = createPinia();

new Vue({
  router,
  store,
  vuetify,
  provide: {
    appConstants: generateAppConstants(),
  },
  pinia,
  render: (h) => h(App),
}).$mount("#app");

console.log("App Build UTC", document.documentElement.dataset.buildTimestampUtc);
