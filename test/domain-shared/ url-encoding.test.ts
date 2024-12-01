import { normalizeURLWithProtocol } from "@/utils/url.utils";

describe("UrlEncoding", () => {
  it("should not normalize hash in url", () => {
    const url = normalizeURLWithProtocol("http://url.com/files/alien controller holder #0-10-000- (1).gcode");
    expect(url).toContain("#");
    expect(url).toContain("%20");
  });
});
