import axios from "axios";

const base = "http://localhost:4000";

export class BaseService {
  protected static async getApi(path: string, options = { unwrap: true }) {
    const response = await axios.get(`${base}/${path}`);

    // Do interception or global handling here
    // ...

    if (options?.unwrap) return response.data;
    return response;
  }
}
