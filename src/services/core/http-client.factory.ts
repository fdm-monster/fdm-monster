import { DefaultHttpClientBuilder } from "@/shared/default-http-client.builder";
import { AxiosInstance } from "axios";
import { SettingsStore } from "@/state/settings.store";

export class HttpClientFactory {
  private settingsStore: SettingsStore;

  constructor({ settingsStore }: { settingsStore: SettingsStore }) {
    this.settingsStore = settingsStore;
  }

  createClient<T extends DefaultHttpClientBuilder>(base: T, buildFluentOptions?: (base: T) => void) {
    base.withMaxBodyLength(1000 * 1000 * 1000);
    base.withMaxContentLength(1000 * 1000 * 1000);
    base.withTimeout(this.settingsStore.getTimeoutSettings().apiTimeout);

    if (buildFluentOptions) {
      buildFluentOptions(base);
    }

    return base.build();
  }

  /**
   * Build a default http client with DefaultHttpClientBuilder.
   * @param buildFluentOptions customize the client with builder options of DefaultHttpClientBuilder.
   */
  createDefaultClient(buildFluentOptions?: (base: DefaultHttpClientBuilder) => void) {
    const builder = new DefaultHttpClientBuilder();
    return this.createClient(builder, buildFluentOptions);
  }

  createClientWithBaseUrl<T extends DefaultHttpClientBuilder>(
    base: T,
    baseAddress: string,
    buildFluentOptions?: (base: T) => void
  ): AxiosInstance {
    return this.createClient(base, (builder) => {
      builder.withBaseUrl(baseAddress);

      if (buildFluentOptions) {
        buildFluentOptions(base);
      }
    });
  }
}
