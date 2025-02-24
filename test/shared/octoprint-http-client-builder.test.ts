import { contentTypeHeaderKey, jsonContentType } from "@/services/octoprint/constants/octoprint-service.constants";
import { OctoprintHttpClientBuilder } from "@/services/octoprint/utils/octoprint-http-client.builder";

describe(OctoprintHttpClientBuilder.name, () => {
  it("should build http client with api key without error", () => {
    const uut = new OctoprintHttpClientBuilder();
    const httpClient = uut
      .withXApiKeyHeader("123")
      .withHeaders({ [contentTypeHeaderKey]: jsonContentType })
      .withBaseUrl("http://localhost:8080/")
      .withTimeout(500)
      .withMaxBodyLength(1000 * 1000)
      .withMaxContentLength(1000 * 1000)
      .withJsonContentTypeHeader()
      .build();

    expect(httpClient).toBeDefined();
  });

  it("should build http client when missing base url", () => {
    const uut = new OctoprintHttpClientBuilder();

    expect(() =>
      uut
        .withXApiKeyHeader("123")
        .withHeaders({ [contentTypeHeaderKey]: jsonContentType })
        .withTimeout(500)
        .withMaxBodyLength(1000 * 1000)
        .withMaxContentLength(1000 * 1000)
        .withJsonContentTypeHeader()
        .build()
    ).toThrow("Base URL is required");
  });

  it("should not build http client when missing api key", () => {
    const uut = new OctoprintHttpClientBuilder();

    expect(() =>
      uut
        .withXApiKeyHeader(null)
        .withHeaders({ [contentTypeHeaderKey]: jsonContentType })
        .withTimeout(500)
        .withMaxBodyLength(1000 * 1000)
        .withMaxContentLength(1000 * 1000)
        .withJsonContentTypeHeader()
        .build()
    ).toThrow("XApiKey header may not be an empty string");
  });
});
