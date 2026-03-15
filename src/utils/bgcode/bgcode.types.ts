export interface BgCodeBlockHeader {
  type: BgCodeBlockType;
  compression: BgCodeCompression;
  uncompressedSize: number;
  compressedSize: number;
  blockSize: number;
  blockStartOffset: number;
  headerSize: BgCodeHeaderSize;
  parameterOffset: number;
  parametersSize: number;
  parameters: BgCodeThumbnailParameters | BgCodeGenericEncodingParameters | BgCodeGcodeEncodingParameters;
  dataOffset: number;
  dataSize: number;
  checksumOffset: number;
  checksumSize: number;
  checksumType: number;
}

export const BgCodeBlockTypes = {
  FileMetadata: 0,
  PrinterMetadata: 3,
  Thumbnail: 5,
  PrintMetadata: 4,
  SlicerMetadata: 2,
  GCode: 1,
} as const;

export type BgCodeBlockType = (typeof BgCodeBlockTypes)[keyof typeof BgCodeBlockTypes];

export const BgCodeBlockTypeName: Record<BgCodeBlockType, string> = {
  [BgCodeBlockTypes.FileMetadata]: "FileMetadata",
  [BgCodeBlockTypes.GCode]: "GCode",
  [BgCodeBlockTypes.SlicerMetadata]: "SlicerMetadata",
  [BgCodeBlockTypes.PrinterMetadata]: "PrinterMetadata",
  [BgCodeBlockTypes.PrintMetadata]: "PrintMetadata",
  [BgCodeBlockTypes.Thumbnail]: "Thumbnail",
};

export const BgCodeBlockParameterSizes = {
  [BgCodeBlockTypes.FileMetadata]: 2,
  [BgCodeBlockTypes.GCode]: 2,
  [BgCodeBlockTypes.SlicerMetadata]: 2,
  [BgCodeBlockTypes.PrinterMetadata]: 2,
  [BgCodeBlockTypes.PrintMetadata]: 2,
  [BgCodeBlockTypes.Thumbnail]: 6,
} as const;

export type BgCodeHeaderSize = 8 | 12;

export const BgCodeCompression = {
  None: 0,
  Deflate: 1,
  Heatshrink_11_4: 2,
  Heatshrink_12_4: 3,
} as const;

export type BgCodeCompression = (typeof BgCodeCompression)[keyof typeof BgCodeCompression];

export const BgCodeCompressionInfo: Record<
  BgCodeCompression,
  { kind: "none" } | { kind: "deflate" } | { kind: "heatshrink"; window: number; lookahead: number }
> = {
  0: { kind: "none" },
  1: { kind: "deflate" },
  2: { kind: "heatshrink", window: 11, lookahead: 4 },
  3: { kind: "heatshrink", window: 12, lookahead: 4 },
};

export const BgCodeCompressionName: Record<BgCodeCompression, string> = {
  0: "None",
  1: "Deflate",
  2: "Heatshrink(11,4)",
  3: "Heatshrink(12,4)",
};

export const BgCodeChecksumTypes = {
  None: 0,
  Crc32: 1,
};

export type BgCodeChecksumType = (typeof BgCodeChecksumTypes)[keyof typeof BgCodeChecksumTypes];

export const BgCodeChecksumTypeSize: Record<BgCodeChecksumType, number> = {
  [BgCodeChecksumTypes.None]: 0,
  [BgCodeChecksumTypes.Crc32]: 4,
};

export const BgCodeThumbnailFormats = {
  PNG: 0,
  JPG: 1,
  QOI: 2,
};

export type BgCodeThumbnailFormat = (typeof BgCodeThumbnailFormats)[keyof typeof BgCodeThumbnailFormats];

export const BgCodeThumbnailFormatName: Record<BgCodeThumbnailFormat, string> = {
  [BgCodeThumbnailFormats.PNG]: "PNG",
  [BgCodeThumbnailFormats.JPG]: "JPG",
  [BgCodeThumbnailFormats.QOI]: "QOI",
};

export const BgCodeThumbnailFormatExtension: Record<BgCodeThumbnailFormat, string> = {
  [BgCodeThumbnailFormats.PNG]: "png",
  [BgCodeThumbnailFormats.JPG]: "jpg",
  [BgCodeThumbnailFormats.QOI]: "qoi",
};

export interface BgCodeThumbnailParameters {
  format: BgCodeThumbnailFormat;
  width: number;
  height: number;
}

export interface BgCodeGenericEncodingParameters {
  encoding: 0; // INI encoding
}

export interface BgCodeGcodeEncodingParameters {
  encoding: GcodeEncodingType;
}

export const GcodeEncodingTypes = {
  None: 0,
  MeatPack: 1,
  MeatPackKeepingComments: 2,
};

export type GcodeEncodingType = (typeof GcodeEncodingTypes)[keyof typeof GcodeEncodingTypes];
