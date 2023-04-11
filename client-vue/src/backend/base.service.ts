import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import Vue from "vue";

export const apiBase = Vue.config.devtools ? "http://127.0.0.1:4000" : ""; // Same-origin policy

export class BaseService {
  static readonly UNWRAP = { unwrap: true };

  protected static async getApi<R>(path: string, options = this.UNWRAP) {
    const response = await axios.get<R>(`${apiBase}/${path}`);

    // Do interception or global handling here
    // ...

    return this.handleResponse(response, options);
  }

  protected static async putApi<T>(path: string, body?: any, options = this.UNWRAP) {
    const response = await axios.put<T>(`${apiBase}/${path}`, body);

    // Do interception or global handling here
    // ...
    return this.handleResponse<T>(response, options);
  }

  protected static async postApi<T>(path: string, body?: any, options = this.UNWRAP) {
    const response = await axios.post<T>(`${apiBase}/${path}`, body);

    // Do interception or global handling here
    // ...
    return this.handleResponse<T>(response, options);
  }

  protected static async postUploadApi<FormData>(
    path: string,
    formData: FormData,
    config: AxiosRequestConfig,
    options = this.UNWRAP
  ) {
    const response = await axios.post(`${apiBase}/${path}`, formData, config);

    // Do interception or global handling here
    // ...
    return this.handleResponse(response, options);
  }

  protected static async deleteApi<T>(path: string, body?: any, options = this.UNWRAP) {
    const response = await axios.request<T>({
      url: `${apiBase}/${path}`,
      method: "delete",
      data: body,
    });

    // Do interception or global handling here
    // ...

    return this.handleResponse<T>(response, options);
  }

  protected static async patchApi<T>(path: string, body: T, options = this.UNWRAP) {
    const response = await axios.patch(`${apiBase}/${path}`, body);

    // Do interception or global handling here
    // ...

    return this.handleResponse(response, options);
  }

  private static handleResponse<T>(response: AxiosResponse<T>, options = this.UNWRAP) {
    if (options?.unwrap) return response.data as T;
    return response as AxiosResponse<T>;
  }
}
