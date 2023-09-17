import { firmwareFlashUploadEvent } from "@/constants/event.constants";

describe("event-constants", () => {
  it("should work for firmware upload", () => {
    expect(firmwareFlashUploadEvent("asd")).toBe("firmware-upload.asd");
  });
});
