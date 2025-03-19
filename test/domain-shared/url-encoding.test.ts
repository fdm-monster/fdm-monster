import { normalizeUrl } from "@/utils/normalize-url";
import { defaultHttpProtocol } from "@/utils/url.utils";

describe("normalize-url", () => {
  it("should not normalize hash in url", () => {
    const url = normalizeUrl("http://url.com/files/alien controller holder #0-10-000- (1).gcode", {
      defaultProtocol: defaultHttpProtocol,
    });
    expect(url).toContain("http://");
    expect(url).toContain("#");
    expect(url).toContain("%20");
  });
});
