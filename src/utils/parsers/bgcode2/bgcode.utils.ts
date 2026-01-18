import {
  BGCODE_EXPECTED_HEADERS,
  BGCODE_HEADER_MARKER,
  BGCODE_HEADER_SIZE,
  BGCODE_MAX_BLOCK_HEADER_SIZE,
  BGCODE_MAX_BLOCK_TYPE,
  BGCODE_MAX_CHECKSUM_TYPE,
  BGCODE_MAX_COMPRESSION,
  BGCODE_MIN_BLOCK_HEADER_SIZE, BGCODE_PARAMETER_THUMBNAIL_MAX_FORMAT
} from "./bgcode.constants";
import { FileHandle } from "node:fs/promises";
import {
  type BgCodeBlockHeader,
  type BgCodeBlockType,
  type BgCodeHeaderSize,
  type BgCodeChecksumType,
  BgCodeBlockTypes,
  BgCodeCompression,
  BgCodeCompressionInfo,
  BgCodeCompressionName,
  BgCodeChecksumTypeSize,
  BgCodeBlockParameterSizes
} from "./bgcode.types";
import { inflateSync } from "node:zlib";
import { HeatshrinkDecoder } from "./heatshrink-decoder";

export async function parseFileHeader(fileHandle: FileHandle): Promise<{
  magic: string;
  version: number;
  checksumType: number;
}> {
  const buffer = Buffer.alloc(BGCODE_HEADER_SIZE);
  await fileHandle.read(buffer);

  if (buffer.length < BGCODE_HEADER_SIZE) {
    throw new Error("File too small to be a valid BGCode file");
  }

  const magic = buffer.toString("ascii", 0, 4);
  if (magic !== BGCODE_HEADER_MARKER) {
    throw new Error(`Invalid BGCode file: magic number not found (got "${ magic }", expected ${ BGCODE_HEADER_MARKER })`);
  }

  const version = buffer.readUInt32LE(4);
  const checksumType = buffer.readUInt16LE(8);

  return { magic, version, checksumType };
}

export async function parseBlockHeaders(fileHandle: FileHandle, fileSize: number, checksumType: number, skipGcode: true) {
  let offset = BGCODE_HEADER_SIZE;
  const blockHeaders: BgCodeBlockHeader[] = [];
  let currentExpectedHeaderIndex = 0;

  while (offset < fileSize) {
    const blockHeader = await parseBlockHeader(fileHandle, fileSize, offset, checksumType);
    if (skipGcode && blockHeader.type == BgCodeBlockTypes.GCode) {
      break;
    }

    const expectedType = BGCODE_EXPECTED_HEADERS[currentExpectedHeaderIndex];
    if (blockHeader.type !== expectedType) {
      const nextExpectedType = BGCODE_EXPECTED_HEADERS[currentExpectedHeaderIndex + 1];
      if (blockHeader.type !== nextExpectedType) {
        throw new Error(`Unexpected header header type ${ blockHeader.type }, expected either ${ expectedType } or next ${ nextExpectedType }`);
      }
      currentExpectedHeaderIndex++;
    }

    if (Number.isNaN(blockHeader.blockSize)) {
      throw new Error(`Unexpected blockHeader.blockSize ${ blockHeader.blockSize }`);
    }

    offset += blockHeader.blockSize;
    blockHeaders.push(blockHeader);
  }

  return blockHeaders;
}

export async function parseBlockHeader(
  fileHandle: FileHandle,
  fileSize: number,
  blockStartOffset: number,
  checksumType: BgCodeChecksumType
): Promise<BgCodeBlockHeader> {
  if (blockStartOffset + BGCODE_MAX_BLOCK_HEADER_SIZE > fileSize) {
    throw new Error("Not enough data for block header");
  }

  const buffer = Buffer.alloc(BGCODE_MAX_BLOCK_HEADER_SIZE);
  await fileHandle.read({
    buffer,
    offset: 0,
    length: BGCODE_MAX_BLOCK_HEADER_SIZE,
    position: blockStartOffset,
  });

  const type = buffer.readUInt16LE(0) as BgCodeBlockType;
  if (type > BGCODE_MAX_BLOCK_TYPE) {
    throw new Error(`Block header type ${ type } exceeds ${ BGCODE_MAX_BLOCK_TYPE }, cant parse block`);
  }

  const compression = buffer.readUInt16LE(2) as BgCodeCompression;
  if (compression > BGCODE_MAX_COMPRESSION) {
    throw new Error(`Block header compression ${ compression } exceeds ${ BGCODE_MAX_COMPRESSION }, cant parse block`);
  }

  const uncompressedSize = buffer.readUInt32LE(4);
  if (uncompressedSize === 0) {
    throw new Error(`Uncompressed Size is 0`);
  }

  let compressedSize = 0;
  let headerSize = BGCODE_MIN_BLOCK_HEADER_SIZE as BgCodeHeaderSize;
  if (compression > 0) {
    compressedSize = buffer.readUInt32LE(8);
    if (compressedSize === 0) {
      throw new Error(`Compression is ${ BgCodeCompressionName[compression] } but compressed size is ${ compressedSize }}`);
    }
    headerSize = BGCODE_MAX_BLOCK_HEADER_SIZE;
  }


  const checksumSize = calculateChecksumSize(checksumType);
  const blockSize = calculateBlockSize(checksumSize, type, compression, uncompressedSize, compressedSize);
  const parameterOffset = blockStartOffset + headerSize;
  const parametersSize = calculateParameterSize(type);
  const parameterBuffer = await getBlockParsedParameters(fileHandle, parameterOffset, parametersSize);
  const parameters = parseBlockParameters(type, parameterBuffer);
  const dataOffset = parameterOffset + parametersSize;
  const dataSize = blockSize - parametersSize - checksumSize;
  const checksumOffset = dataOffset + dataSize;

  return {
    type,
    compression,
    uncompressedSize,
    compressedSize,
    blockSize,
    blockStartOffset,
    headerSize,
    parameterOffset,
    parameters,
    parametersSize,
    dataOffset,
    dataSize,
    checksumOffset,
    checksumSize,
    checksumType
  }
}

export async function getBlockParsedParameters(fileHandle: FileHandle, parameterOffset: number, parametersSize: number) {
  const parameters = Buffer.alloc(parametersSize);
  if (parametersSize > 0) {
    await fileHandle.read({ buffer: parameters, offset: 0, length: parametersSize, position: parameterOffset });
  }

  return parameters;
}

export async function getBlockData(fileHandle: FileHandle, blockHeader: BgCodeBlockHeader) {
  if (blockHeader.blockSize === 0) {
    throw new Error("Cant get block data for block with size 0");
  }
  if (blockHeader.blockSize === 1E3) {
    throw new Error(`Cant get block data for block with size ${ blockHeader.blockSize } > ${ 1E3 }`);
  }

  const data = Buffer.alloc(blockHeader.dataSize);
  await fileHandle.read({ buffer: data, offset: 0, length: blockHeader.dataSize, position: blockHeader.dataOffset });
  return data;
}

export function decompressBlock(
  compression: BgCodeCompression,
  data: Buffer
) {
  const info = BgCodeCompressionInfo[compression];

  switch (info.kind) {
    case "none":
      return data;
    case "deflate":
      return inflateSync(data);
    case "heatshrink":
      const decoder = new HeatshrinkDecoder(info.window, info.lookahead);
      return decoder.decompress(data);
    default:
      throw new Error(`Unknown compression type: ${compression}`);
  }
}

export function parseBlockParameters(blockType: BgCodeBlockType, parameters: Buffer) {
  const parameterSize = BgCodeBlockParameterSizes[blockType];
  if (parameters.length !== parameterSize) {
    throw new Error(`Block Parameters should be exactly ${ parameterSize } bytes long`);
  }

  if (blockType === BgCodeBlockTypes.Thumbnail) {
    return {
      format: calculateThumbnailFormat(parameters.readUInt16LE(0)),
      width: parameters.readUInt16LE(2),
      height: parameters.readUInt16LE(4),
    }
  }

  return {
    encoding: parameters.readUInt16LE(0)
  }
}

function calculateBlockSize(
  checksumSize: number,
  blockType: BgCodeBlockType,
  compression: BgCodeCompression,
  uncompressedSize: number,
  compressedSize: number
) {
  const headerSize = compression > 0 ? 12 : 8;
  const dataSize = compression === 0 ? uncompressedSize : compressedSize;
  // Thumbnail type (5) has 3 fields of 2 bytes each
  const parametersSize = blockType === BgCodeBlockTypes.Thumbnail ? 6 : 2;

  return headerSize + parametersSize + dataSize + checksumSize;
}

function calculateChecksumSize(checksumType: BgCodeChecksumType) {
  if (checksumType > BGCODE_MAX_CHECKSUM_TYPE) {
    throw new Error(`Checksum type ${ checksumType } exceeds max ${ BGCODE_MAX_CHECKSUM_TYPE }`);
  }

  return BgCodeChecksumTypeSize[checksumType];
}

function calculateParameterSize(blockType: BgCodeBlockType) {
  if (blockType > BGCODE_MAX_BLOCK_TYPE) {
    throw new Error(`Checksum type ${ blockType } exceeds max ${ BGCODE_MAX_BLOCK_TYPE }`);
  }

  return BgCodeBlockParameterSizes[blockType];
}

function calculateThumbnailFormat(formatParameter: number) {
  if (formatParameter > BGCODE_PARAMETER_THUMBNAIL_MAX_FORMAT) {
    throw new Error(`Thumbnail format type ${ formatParameter } exceeds max ${ BGCODE_PARAMETER_THUMBNAIL_MAX_FORMAT }`);
  }
  return formatParameter;
}

export async function extractMetadataFromBlocks(
  fileHandle: FileHandle,
  blockHeaders: BgCodeBlockHeader[]
): Promise<Record<string, string>> {
  const metadata: Record<string, string> = {};

  const metadataBlocks = blockHeaders.filter(b =>
    b.type === BgCodeBlockTypes.FileMetadata ||
    b.type === BgCodeBlockTypes.SlicerMetadata ||
    b.type === BgCodeBlockTypes.PrinterMetadata ||
    b.type === BgCodeBlockTypes.PrintMetadata
  );

  for (const header of metadataBlocks) {
    const blockData = await getBlockData(fileHandle, header);
    const data = decompressBlock(header.compression, blockData);
    const text = data.toString("utf8");
    extractMetadataFromText(text, metadata);
  }

  return metadata;
}

const METADATA_KEY_NORMALIZATION: Record<string, string> = {
  'producer': 'producer',
  'produced on': 'produced_on',
  'print time': 'print_time',
  'estimated printing time (silent mode)': 'estimated_printing_time_silent_mode',
  'estimated printing time (normal mode)': 'estimated_printing_time_normal_mode',
  'layer height': 'layer_height',
  'first layer height': 'first_layer_height',
  'initial layer height': 'initial_layer_height',
  'nozzle diameter': 'nozzle_diameter',
  'filament diameter': 'filament_diameter',
  'filament density': 'filament_density',
  'filament used [mm]': 'filament_used_mm',
  'filament used [cm3]': 'filament_used_cm3',
  'filament used [g]': 'filament_used_g',
  'bed temperature': 'bed_temperature',
  'temperature': 'temperature',
  'fill density': 'fill_density',
  'filament type': 'filament_type',
  'printer model': 'printer_model',
  'max layer z': 'max_layer_z',
  'total layers': 'total_layers',
  'layer count': 'layer_count',
};

function extractMetadataFromText(text: string, metadata: Record<string, string>): void {
  const lines = text.split('\n');

  for (const line of lines) {
    const keyValuePair = parseMetadataLine(line);
    if (!keyValuePair) {
      continue;
    }

    const { key, value } = keyValuePair;
    metadata[key] = value;
  }
}

function parseMetadataLine(line: string): { key: string; value: string } | null {
  const equalIndex = line.indexOf('=');
  if (equalIndex === -1) {
    return null;
  }

  const rawKey = line.substring(0, equalIndex).trim().toLowerCase();
  const value = line.substring(equalIndex + 1).trim();

  if (!rawKey || !value) {
    return null;
  }

  const normalizedKey = METADATA_KEY_NORMALIZATION[rawKey] || rawKey.replace(/\s+/g, '_');
  return { key: normalizedKey, value };
}
