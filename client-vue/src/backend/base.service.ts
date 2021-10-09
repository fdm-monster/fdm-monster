import axios, { AxiosResponse } from "axios";

export const apiBase = "http://localhost:4000";

export class BaseService {
  protected static async getApi(path: string, options = { unwrap: true }) {
    const response = await axios.get(`${apiBase}/${path}`);

    // Do interception or global handling here
    // ...

    return this.handleResponse(response, options);
  }

  protected static async postApi<T>(path: string, body?: T, options = { unwrap: true }) {
    const response = await axios.post(`${apiBase}/${path}`, body);

    // Do interception or global handling here
    // ...

    return this.handleResponse(response, options);
  }

  protected static async deleteApi(path: string, options = { unwrap: true }) {
    const response = await axios.delete(`${apiBase}/${path}`);

    // Do interception or global handling here
    // ...

    return this.handleResponse(response, options);
  }

  protected static async patchApi<T>(path: string, body: T, options = { unwrap: true }) {
    const response = await axios.patch(`${apiBase}/${path}`, body);

    // Do interception or global handling here
    // ...

    return this.handleResponse(response, options);
  }

  private static handleResponse<T>(response: AxiosResponse<T>, options = { unwrap: true }) {
    if (options?.unwrap) return response.data as T;
    return response as AxiosResponse<T>;
  }
}
