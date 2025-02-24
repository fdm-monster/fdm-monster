import { DefaultHttpClientBuilder } from "@/shared/default-http-client.builder";
import { contentTypeHeaderKey, jsonContentType } from "@/services/octoprint/constants/octoprint-service.constants";

describe(DefaultHttpClientBuilder.name, () => {
  it("should build http client without error", () => {
    const uut = new DefaultHttpClientBuilder();
    const httpClient = uut
      .withHeaders({ [contentTypeHeaderKey]: jsonContentType })
      .withBaseUrl("http://localhost:8080/")
      .withTimeout(500)
      .withMaxBodyLength(1000 * 1000)
      .withMaxContentLength(1000 * 1000)
      .withJsonContentTypeHeader()
      .build();

    expect(httpClient).toBeDefined();
  });

  it("should build http client with stream response without error", () => {
    const uut = new DefaultHttpClientBuilder();
    const httpClient = uut.withStreamResponse().build();
    expect(httpClient).toBeDefined();
  });

  it("should not build http client with unspecified or negative timeout in withTimeout", () => {
    const uut = new DefaultHttpClientBuilder();
    expect(() => uut.withTimeout(null).build()).toThrow("Timeout value (milliseconds) must be greater than 0");
    expect(() => uut.withTimeout(-1).build()).toThrow("Timeout value (milliseconds) must be greater than 0");
  });

  it("should not build http client with unspecified baseUrl in withBaseUrl", () => {
    const uut = new DefaultHttpClientBuilder();
    expect(() => uut.withBaseUrl(null).build()).toThrow("Base address may not be an empty string");
  });
});
