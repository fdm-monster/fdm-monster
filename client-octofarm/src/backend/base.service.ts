import axios, { AxiosResponse } from "axios";

const base = "http://localhost:4000";

export class BaseService {
  private static handleResponse(response: AxiosResponse, options = { unwrap: true }) {
    if (options?.unwrap) return response.data;
    return response;
  }

  protected static async getApi(path: string, options = { unwrap: true }) {
    const response = await axios.get(`${base}/${path}`);

    // Do interception or global handling here
    // ...

    return this.handleResponse(response);
  }

  protected static async postApi<T>(path: string, body: T, options = { unwrap: true }) {
    const response = await axios.post(`${base}/${path}`, body);

    // Do interception or global handling here
    // ...

    return this.handleResponse(response);
  }

  protected static async patchApi<T>(path: string, body: T, options = { unwrap: true }) {
    const response = await axios.patch(`${base}/${path}`, body);

    // Do interception or global handling here
    // ...

    return this.handleResponse(response);
  }
}
