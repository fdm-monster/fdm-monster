import { RoutingService } from "@/services/routing.service";
import type { PrinterCache } from "@/state/printer.cache";
import type { IPrinterTagService } from "@/services/interfaces/printer-tag.service.interface";

function makeService(
  printers: { id: number; name: string }[],
  tags: { id: number; name: string; printerIds: number[] }[],
): RoutingService {
  const printerCache = {
    listCachedPrinters: async () => printers,
  } as unknown as PrinterCache;

  const printerTagService = {
    listTags: async () =>
      tags.map((t) => ({
        id: t.id,
        name: t.name,
        color: "",
        printers: t.printerIds.map((printerId) => ({ printerId, tagId: t.id })),
      })),
  } as unknown as IPrinterTagService;

  return new RoutingService(printerCache, printerTagService);
}

describe("RoutingService.resolve", () => {
  it("matches a printer by exact name, case-insensitively", async () => {
    const svc = makeService([{ id: 7, name: "Prusa MK4" }], []);
    const res = await svc.resolve("prusa mk4");
    expect(res.kind).toBe("printer");
    expect(res.matchedName).toBe("Prusa MK4");
    expect(res.printerIds).toEqual([7]);
  });

  it("matches a tag and returns all of its printer ids", async () => {
    const svc = makeService([{ id: 1, name: "Mini A" }], [{ id: 3, name: "prusa-mini", printerIds: [1, 2, 5] }]);
    const res = await svc.resolve("prusa-mini");
    expect(res.kind).toBe("tag");
    expect(res.matchedName).toBe("prusa-mini");
    expect(res.printerIds).toEqual([1, 2, 5]);
  });

  it("prefers a printer-name match over a tag-name match", async () => {
    const svc = makeService([{ id: 9, name: "shared" }], [{ id: 4, name: "shared", printerIds: [1, 2] }]);
    const res = await svc.resolve("shared");
    expect(res.kind).toBe("printer");
    expect(res.printerIds).toEqual([9]);
  });

  it("returns kind 'none' when nothing matches", async () => {
    const svc = makeService([{ id: 1, name: "Voron" }], [{ id: 2, name: "resin", printerIds: [3] }]);
    const res = await svc.resolve("ender-3");
    expect(res.kind).toBe("none");
    expect(res.printerIds).toEqual([]);
  });

  it("returns kind 'none' for null, empty, or whitespace targets", async () => {
    const svc = makeService([{ id: 1, name: "Voron" }], []);
    for (const target of [null, "", "   "]) {
      const res = await svc.resolve(target);
      expect(res.kind).toBe("none");
      expect(res.routingTarget).toBe(target);
    }
  });
});
