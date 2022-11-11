import Vue from "vue";
import App from "./App.vue";

// import "./registerServiceWorker";
import router from "./router";
import vuetify from "./plugins/vuetify";
import axios from "axios";
import VueAxios from "vue-axios";
import VueBus from "vue-bus";
import { configureVeeValidate } from "@/plugins/veevalidate";
import { generateAppConstants } from "@/constants/app.constants";
import { registerFileDropDirective } from "@/directives/file-upload.directive";
import { errorEvent } from "@/event-bus/alert.events";
import { createPinia, PiniaVuePlugin } from "pinia";
import BaseDialog from "@/components/Generic/Dialogs/BaseDialog.vue";

Vue.config.productionTip = false;
Vue.use(VueAxios, axios);
Vue.use(VueBus);

configureVeeValidate();
registerFileDropDirective();

window.addEventListener("unhandledrejection", (event) => {
  if (event.reason?.isAxiosError) {
    console.warn(`Handled error through alert`, event.reason);
  }
  Vue.bus.emit(errorEvent, event);
  event.preventDefault();
});

// Sentry.init({
//   Vue,
//   dsn: "https://f64683e8d1cb4ac291434993cff1bf9b@o4503975545733120.ingest.sentry.io/4503975546912768",
//   integrations: [
//     new BrowserTracing({
//       routingInstrumentation: Sentry.vueRouterInstrumentation(router),
//       tracingOrigins: ["localhost", "my-site-url.com", /^\//],
//     }),
//   ],
//   // Set tracesSampleRate to 1.0 to capture 100%
//   // of transactions for performance monitoring.
//   // We recommend adjusting this value in production
//   tracesSampleRate: 1.0,
// });

// Not sure how this works with Sentry
Vue.config.errorHandler = (err: Error, vm: Vue, info: string) => {
  console.log("Global Error captured", err, vm, info);
};

Vue.use(PiniaVuePlugin);
const pinia = createPinia();

Vue.component(BaseDialog.name, BaseDialog);

new Vue({
  router,
  vuetify,
  provide: {
    appConstants: generateAppConstants(),
  },
  pinia,
  render: (h) => h(App),
}).$mount("#app");

console.log("App Build UTC", document.documentElement.dataset.buildTimestampUtc);
