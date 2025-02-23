import { DefaultHttpClientBuilder } from "@/shared/default-http-client.builder";
import { apiKeyHeaderKey } from "@/services/octoprint/constants/octoprint-service.constants";
import { AxiosInstance } from "axios";

export class OctoprintHttpClientBuilder extends DefaultHttpClientBuilder {
  override build<D = any>(): AxiosInstance {
    if (!this.axiosOptions.baseURL) {
      throw new Error("Base URL is required");
    }

    return super.build<D>();
  }

  withXApiKeyHeader(apiKey: string): DefaultHttpClientBuilder {
    if (!apiKey?.length) {
      throw new Error("XApiKey header may not be an empty string");
    }

    this.withHeaders({ [apiKeyHeaderKey]: apiKey });

    return this;
  }
}
