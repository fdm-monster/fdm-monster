import { getDefaultTimeout } from "@/constants/server-settings.constants";
import axios, { AxiosInstance, AxiosProgressEvent, AxiosRequestConfig } from "axios";
import {
  contentTypeHeaderKey,
  jsonContentType,
  multiPartContentType,
} from "@/services/octoprint/constants/octoprint-service.constants";

export interface IHttpClientBuilder {
  build(): AxiosInstance;
}

export class DefaultHttpClientBuilder implements IHttpClientBuilder {
  protected axiosOptions: AxiosRequestConfig;

  constructor() {
    this.axiosOptions = {
      baseURL: "",
      timeout: getDefaultTimeout().apiTimeout,
      headers: {
        [contentTypeHeaderKey]: jsonContentType,
      },
    };
  }

  build<D = any>(): AxiosInstance {
    const axiosConfig: AxiosRequestConfig<D> = {
      baseURL: this.axiosOptions.baseURL,
      timeout: this.axiosOptions.timeout,
      headers: this.axiosOptions.headers,
      data: this.axiosOptions.data as D,
      maxBodyLength: this.axiosOptions.maxBodyLength ?? 1000 * 1000 * 1000, // 1GB,
      maxContentLength: this.axiosOptions.maxContentLength ?? 1000 * 1000 * 1000, // 1GB
    };

    return axios.create(axiosConfig);
  }

  withMaxBodyLength(maxBodyLength: number): DefaultHttpClientBuilder {
    this.axiosOptions.maxBodyLength = maxBodyLength;
    return this;
  }

  withMaxContentLength(maxContentLength: number): DefaultHttpClientBuilder {
    this.axiosOptions.maxContentLength = maxContentLength;
    return this;
  }

  withBaseUrl(baseUrl: string): DefaultHttpClientBuilder {
    if (!baseUrl?.length) {
      throw new Error("Base address may not be an empty string");
    }

    if (!baseUrl?.includes("://")) {
      throw new Error("Base address must include a protocol like https:// or ws://");
    }

    this.axiosOptions.baseURL = baseUrl;
    return this;
  }

  /**
   * Set the timeout for the http client.
   * @param timeout the value for timeout in milliseconds.
   */
  withTimeout(timeout: number): DefaultHttpClientBuilder {
    if (!timeout || timeout <= 0) {
      throw new Error("Timeout value (milliseconds) must be greater than 0");
    }

    this.axiosOptions.timeout = timeout;
    return this;
  }

  withMultiPartFormData(): this {
    this.withHeaders({
      "Content-Type": multiPartContentType,
    });
    return this;
  }

  withStreamResponse(): this {
    this.axiosOptions.responseType = "stream";
    return this;
  }

  withOnUploadProgress(handler: (progressEvent: AxiosProgressEvent) => void): this {
    this.axiosOptions.onUploadProgress = handler;
    return this;
  }

  withJsonContentTypeHeader(): DefaultHttpClientBuilder {
    this.withHeaders({ [contentTypeHeaderKey]: jsonContentType });
    return this;
  }

  withHeaders(headers: Record<string, string>): DefaultHttpClientBuilder {
    this.axiosOptions.headers = {
      ...this.axiosOptions.headers,
      ...headers,
    };
    return this;
  }
}
