import glob from "fast-glob";

const VIRTUAL_ID = "virtual:controllers";
const RESOLVED_ID = "\0virtual:controllers";

export function controllersPlugin(pattern = "src/controllers/*.controller.ts") {
  return {
    name: "vite-plugin-controllers",
    resolveId(id: string) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    async load(id: string) {
      if (id !== RESOLVED_ID) return;

      const files = await glob(pattern, { absolute: true });
      const imports = files.map((f, i) => `import * as m${i} from ${JSON.stringify(f)};`).join("\n");
      const exports = `export default [${files.map((_, i) => `m${i}`).join(", ")}];`;
      return `${imports}\n${exports}`;
    },
  };
}
