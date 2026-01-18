import { BgcodeParser } from "./bgcode.parser.mts";

const parser = new BgcodeParser();

await parser.parse("679de1fe-9a4d-fe7e-6903-2bfb8ac9919f.bgcode", false);
