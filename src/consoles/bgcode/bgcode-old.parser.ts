import { open, writeFile } from "node:fs/promises";
import { decompressBlock, getBlockData, parseBlockHeaders, parseFileHeader } from "@/utils/parsers/bgcode2/bgcode.utils";
import { BgCodeBlockTypes, BgCodeThumbnailParameters } from "@/utils/parsers/bgcode2/bgcode.types";
import { processThumbnail } from "@/utils/parsers/bgcode2/bgcode-thumbnail.parser";

interface DGCodeParseResult {

}

export class BgcodeParser2 {
  async parse(filePath: string, extractGcode: boolean): Promise<DGCodeParseResult> {
    const fileHandle = await open(filePath, "r");
    const { size } = await fileHandle.stat();

    const { version, checksumType, magic } = await parseFileHeader(fileHandle);
    if (version !== 1) {
      throw new Error("BGCode version does not equal supported version 1");
    }

    const blockHeaders = await parseBlockHeaders(fileHandle, size, checksumType, true);

    const metadataBlocks = blockHeaders.filter(b =>
      b.type === BgCodeBlockTypes.FileMetadata ||
      b.type === BgCodeBlockTypes.PrinterMetadata ||
      b.type === BgCodeBlockTypes.PrintMetadata ||
      b.type === BgCodeBlockTypes.SlicerMetadata
    );

    const blockTypeNames: Record<number, string> = {
      [BgCodeBlockTypes.FileMetadata]: 'FileMetadata',
      [BgCodeBlockTypes.PrinterMetadata]: 'PrinterMetadata',
      [BgCodeBlockTypes.PrintMetadata]: 'PrintMetadata',
      [BgCodeBlockTypes.SlicerMetadata]: 'SlicerMetadata',
    };

    for (const header of metadataBlocks) {
      const blockData = await getBlockData(fileHandle, header);
      const data = decompressBlock(header.compression, blockData);
      const iniContent = data.toString('utf-8');

      // console.log(`\n=== ${blockTypeNames[header.type]} (Block type ${header.type}) ===`);
      // console.log(`Uncompressed size: ${header.uncompressedSize}, Compressed size: ${header.dataSize}, Compression: ${header.compression}`);
      // console.log(iniContent);
      // console.log('=== End ===\n');
    }

    const thumbnailBlockHeaders = blockHeaders.filter(b => b.type === BgCodeBlockTypes.Thumbnail);
    let thumbnailIndex = 0;
    for (const header of thumbnailBlockHeaders) {
      const blockData = await getBlockData(fileHandle, header);
      const data = decompressBlock(header.compression, blockData);
      const parameters = header.parameters as BgCodeThumbnailParameters;
      // console.log(`Got thumbnail data ${ data.length } ${ JSON.stringify(parameters) }`);

      // Process and write thumbnail to file
      const result = processThumbnail(data, parameters);
      const filename = `thumbnail_${parameters.width}x${parameters.height}_${thumbnailIndex}.${result.extension}`;
      await writeFile(filename, result.data);
      // console.log(`Wrote thumbnail to ${filename}`);
      thumbnailIndex++;
    }

    await fileHandle.close();

    return {};
  }
}
