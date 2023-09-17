import { AxiosError } from "axios";

export class AxiosMock {
  mockStatus?: number = undefined;
  mockResponse = undefined;
  isStream?: boolean = undefined;
  willThrow?: boolean = undefined;
  timeout = null;
  streamRejectPayload: any;

  constructor(timeoutSettings: any) {
    this.timeout = timeoutSettings;
  }

  setStreamWillError(rejectPayload = undefined) {
    this.streamRejectPayload = rejectPayload;
  }

  saveMockResponse(response: any, status: number, isStream = false, throws = false) {
    this.mockStatus = status;
    this.mockResponse = response;
    this.isStream = isStream;
    this.willThrow = throws;
  }

  async getMockResponse() {
    const result = Promise.resolve({
      status: this.mockStatus,
      data: this.isStream
        ? {
            pipe: (stream) => {},
            on: (event, cb) => {
              if (event === "error") {
                if (this.streamRejectPayload) {
                  return cb(this.streamRejectPayload);
                }
              } else {
                return cb(this.mockResponse);
              }
            },
          }
        : this.mockResponse,
    });

    if (this.willThrow) {
      throw new AxiosError(this.mockResponse, this.mockStatus);
    }
    return result;
  }

  get() {
    return this.getMockResponse();
  }

  post() {
    return this.getMockResponse();
  }

  patch() {
    return this.getMockResponse();
  }

  delete() {
    return this.getMockResponse();
  }
}
