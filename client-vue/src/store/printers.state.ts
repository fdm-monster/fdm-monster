import { getModule, Module, VuexModule } from "vuex-module-decorators";
import store from "@/store/index";

@Module({
  dynamic: true,
  store: store,
  name: PrintersModule.name,
})
class PrintersModule extends VuexModule {}

export const printersState = getModule(PrintersModule, store);
