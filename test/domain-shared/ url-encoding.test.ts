import { normalizeUrl } from "@/utils/normalize-url";

describe("UrlEncoding", () => {
  it("should not normalize hash in url", () => {
    const url = normalizeUrl("http://url.com/files/alien controller holder #0-10-000- (1).gcode", { defaultProtocol: "https" });
    expect(url).toContain("http://");
    expect(url).toContain("#");
    expect(url).toContain("%20");
  });
});
