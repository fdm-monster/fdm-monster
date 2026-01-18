import { open } from "node:fs/promises";
import { decompressBlock, getBlockData, parseBlockHeaders, parseFileHeader } from "./bgcode.utils.mts";
import { BgCodeBlockHeader, BgCodeBlockTypes, BgCodeThumbnailParameters } from "./bgcode.types.mts";

interface DGCodeParseResult {

}

export class BgcodeParser {
  async parse(filePath: string, extractGcode: boolean): Promise<DGCodeParseResult> {
    const fileHandle = await open(filePath, "r");
    const { size } = await fileHandle.stat();

    const { version, checksumType, magic } = await parseFileHeader(fileHandle);
    if (version !== 1) {
      throw new Error("BGCode version does not equal supported version 1");
    }

    const blockHeaders = await parseBlockHeaders(fileHandle, size, checksumType, true);
    let i = 0;
    for (const blockHeader of blockHeaders) {
      i++;
      console.log(`Block ${ i } type ${blockHeader.type} parametersSize ${blockHeader.parametersSize} headerSize ${blockHeader.headerSize} dataSize ${blockHeader.uncompressedSize} ${blockHeader.dataSize} compression ${ blockHeader.compression }`);
    }

    const thumbnailBlockHeaders = blockHeaders.filter(b => b.type === BgCodeBlockTypes.Thumbnail);
    for (const header of thumbnailBlockHeaders) {
      const blockData = await getBlockData(fileHandle, header);
      const data = decompressBlock(header.compression, blockData);
      const parameters = header.parameters as BgCodeThumbnailParameters;
      console.log(`Got thumbnail data ${ data.length } ${ JSON.stringify(parameters) }`);
    }

    await fileHandle.close();

    return {};
  }
}
