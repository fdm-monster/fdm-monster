class AxiosMock {
  mockStatus = undefined;
  mockResponse = undefined;
  isStream = undefined;
  timeout = null;
  streamRejectPayload;

  constructor(timeoutSettings) {
    this.timeout = timeoutSettings;
  }

  setStreamWillError(rejectPayload = undefined) {
    this.streamRejectPayload = rejectPayload;
  }

  saveMockResponse(response, status, isStream = false) {
    this.mockStatus = status;
    this.mockResponse = response;
    this.isStream = isStream;
  }

  async getMockResponse() {
    return Promise.resolve({
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
