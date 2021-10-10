import Vue from "vue";
import Vuex from "vuex";
import { config } from "vuex-module-decorators";

config.rawError = true;

Vue.use(Vuex);

// https://betterprogramming.pub/the-state-of-typed-vuex-the-cleanest-approach-2358ee05d230
const store = new Vuex.Store({});

export default store;
