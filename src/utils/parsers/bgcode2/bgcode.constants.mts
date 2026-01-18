export const BGCODE_HEADER_SIZE = 10;

// If compression is not 0, 4 bytes is used for compression size at the end.
export const BGCODE_MIN_BLOCK_HEADER_SIZE = 8;
export const BGCODE_MAX_BLOCK_HEADER_SIZE = 12;
export const BGCODE_HEADER_MARKER = "GCDE";

// 0 = File Metadata Block
// 1 = GCode Block
// 2 = Slicer Metadata Block
// 3 = Printer Metadata Block
// 4 = Print Metadata Block
// 5 = Thumbnail Block
export const BGCODE_MAX_BLOCK_TYPE = 5;

// 0 = No compression
// 1 = Deflate algorithm
// 2 = Heatshrink algorithm with window size 11 and lookahead size 4
// 3 = Heatshrink algorithm with window size 12 and lookahead size 4
export const BGCODE_MAX_COMPRESSION = 3;

// type=- File Header 10 bytes
// type=0 File Metadata Block (optional)
// type=3 Printer Metadata Block
// type=5 Thumbnails Blocks (optional)
// type=4 Print Metadata Block
// type=2 Slicer Metadata Block
// type=1 G-code Blocks
export const BGCODE_EXPECTED_HEADERS = [0, 3, 5, 4, 2, 1] as const;

export const BGCODE_MAX_CHECKSUM_TYPE = 1;

export const BGCODE_PARAMETER_THUMBNAIL_MAX_FORMAT = 2;
