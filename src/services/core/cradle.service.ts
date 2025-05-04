import { AwilixContainer } from "awilix";
import { DITokens } from "@/container.tokens";

export class CradleService {
  constructor(private readonly container: AwilixContainer) {}

  resolve<T>(token: keyof typeof DITokens) {
    return this.container.resolve<T>(token);
  }
}
