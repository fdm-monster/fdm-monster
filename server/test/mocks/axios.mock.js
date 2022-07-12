const { AxiosError } = require("axios");

class AxiosMock {
  mockStatus = undefined;
  mockResponse = undefined;
  isStream = undefined;
  willThrow = undefined;
  timeout = null;
  streamRejectPayload;

  constructor(timeoutSettings) {
    this.timeout = timeoutSettings;
  }

  setStreamWillError(rejectPayload = undefined) {
    this.streamRejectPayload = rejectPayload;
  }

  saveMockResponse(response, status, isStream = false, throws = false) {
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
            }
          }
        : this.mockResponse
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

module.exports = AxiosMock;
