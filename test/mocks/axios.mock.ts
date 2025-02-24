import { AxiosError } from "axios";

export class AxiosMock {
  mockResponses: Record<string, { status: number; data: any; isStream?: boolean; throws?: boolean }> = {};
  timeout: number | null = null;
  streamRejectPayload: any;

  constructor(timeoutSettings: any) {
    this.timeout = timeoutSettings;
  }

  setStreamWillError(rejectPayload: any = undefined) {
    this.streamRejectPayload = rejectPayload;
  }

  saveMockResponse(path: string, response: any, status: number, isStream = false, throws = false) {
    this.mockResponses[path] = { status, data: response, isStream, throws };
  }

  async getMockResponse(path: string) {
    const responseConfig = this.mockResponses[path];

    if (!responseConfig) {
      throw new AxiosError(`No mock response for path: ${path}`);
    }

    const result = Promise.resolve({
      status: responseConfig.status,
      data: responseConfig.isStream
        ? {
            pipe: (stream: any) => {},
            on: (event: any, cb: (payload: any) => void) => {
              if (event === "error") {
                if (this.streamRejectPayload) {
                  return cb(this.streamRejectPayload);
                }
              } else {
                return cb(responseConfig.data);
              }
            },
          }
        : responseConfig.data,
    });

    if (responseConfig.throws) {
      throw new AxiosError(responseConfig.data, responseConfig.status.toString());
    }
    return result;
  }

  get(path: string) {
    return this.getMockResponse(path);
  }

  post(path: string) {
    return this.getMockResponse(path);
  }

  patch(path: string) {
    return this.getMockResponse(path);
  }

  delete(path: string) {
    return this.getMockResponse(path);
  }
}
