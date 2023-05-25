import { AxiosError } from "axios";
import { HttpException } from "@nestjs/common";
import { ClientRequest } from "node:http";

export class ExternalHttpError extends HttpException {
  name = ExternalHttpError.name;

  constructor(error: AxiosError) {
    const request = error.request as ClientRequest;

    const status = error.response?.status;
    const response = error.response?.data;
    const host = request?.host;
    const protocol = request?.protocol;
    const path = request?.path;
    const method = request?.method;
    const reason = `External ${method} request to url '${host}' with path '${path}' failed with status ${status}`;
    const description = `${reason} and response ${response}`;
    super(
      HttpException.createBody(
        {
          reason,
          status,
          protocol,
          host,
          response,
          method,
          path,
        },
        description,
        status
      ),
      status,
      {
        cause: error,
        description,
      }
    );
  }

  toString() {
    return JSON.stringify(this.getResponse());
  }
}
