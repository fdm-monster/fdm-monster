/**
 * BGCode Parser
 * Extracts metadata from Prusa BGCode (.bgcode) binary format files
 *
 * BGCode is a binary G-code format with structured blocks:
 * - File metadata block
 * - Printer metadata block
 * - Print metadata block
 * - Slicer metadata block
 * - Thumbnail blocks
 * - G-code block (compressed)
 *
 * Reference: https://github.com/prusa3d/libbgcode
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

export class BGCodeParser {
  constructor() {
    this.metadata = {};
    this.blocks = [];
  }

  /**
   * Parse a BGCode file and extract all metadata
   * @param {string} filePath - Path to the BGCode file
   * @returns {Object} Parsed metadata
   */
  parse(filePath) {
    console.log(`\nParsing BGCode file: ${path.basename(filePath)}`);

    this.metadata = {
      _fileName: path.basename(filePath),
      _fileType: 'bgcode',
      _parseDate: new Date().toISOString(),
    };

    try {
      const buffer = fs.readFileSync(filePath);

      // Parse file header (10 bytes)
      // Magic number (4 bytes)
      const magic = buffer.toString('ascii', 0, 4);
      if (magic !== 'GCDE') {
        throw new Error(`Invalid BGCode file. Magic number: ${magic}`);
      }
      this.metadata._magic = magic;

      // Version (4 bytes)
      const version = buffer.readUInt32LE(4);
      this.metadata._version = version;
      console.log(`BGCode version: ${version}`);

      // Checksum type (2 bytes)
      const checksumType = buffer.readUInt16LE(8);
      this.metadata._checksumType = this.getChecksumTypeName(checksumType);
      console.log(`Checksum type: ${this.metadata._checksumType}`);

      // Parse blocks starting at offset 10
      let offset = 10;
      let blockCount = 0;

      while (offset < buffer.length && blockCount < 100) { // Safety limit
        const blockInfo = this.parseBlockHeader(buffer, offset, checksumType);
        if (!blockInfo) break;

        this.blocks.push(blockInfo);
        console.log(`Block ${blockCount + 1}: ${blockInfo.type} (compressed: ${blockInfo.compressedSize} bytes, uncompressed: ${blockInfo.uncompressedSize} bytes)`);

        // Calculate offset for block data
        const dataOffset = offset + blockInfo.headerSize + blockInfo.parametersSize;
        const blockData = buffer.slice(dataOffset, dataOffset + blockInfo.dataSize);

        // Parse block data based on type
        switch (blockInfo.type) {
          case 'FILE_METADATA':
          case 'PRINTER_METADATA':
          case 'PRINT_METADATA':
          case 'SLICER_METADATA':
            this.parseMetadataBlock(blockData, blockInfo, blockInfo.type.toLowerCase().replace('_metadata', ''));
            break;
          case 'THUMBNAIL':
            this.parseThumbnailBlock(blockData, blockInfo);
            break;
          case 'GCODE':
            console.log('  G-code block detected (skipping content parse)');
            break;
          default:
            console.log(`  Skipping unknown block type: ${blockInfo.type}`);
        }

        // Move to next block
        offset += blockInfo.headerSize + blockInfo.parametersSize + blockInfo.dataSize;
        if (checksumType > 0) {
          offset += blockInfo.checksumSize;
        }
        blockCount++;
      }

      this.metadata._blocks = this.blocks.map(b => ({
        type: b.type,
        compressedSize: b.compressedSize,
        uncompressedSize: b.uncompressedSize,
        compression: b.compressionType
      }));

      console.log(`Parsed ${blockCount} blocks total`);

    } catch (error) {
      console.error(`Error parsing BGCode file: ${error.message}`);
      console.error(error.stack);
      this.metadata._error = error.message;
    }

    return this.getNormalizedMetadata();
  }

  /**
   * Parse block header (8 or 12 bytes depending on compression)
   * @param {Buffer} buffer - File buffer
   * @param {number} offset - Current offset
   * @param {number} checksumType - Checksum type from file header
   * @returns {Object} Block info
   */
  parseBlockHeader(buffer, offset, checksumType) {
    if (offset + 8 > buffer.length) return null;

    // Block type (2 bytes)
    const typeCode = buffer.readUInt16LE(offset);
    const type = this.getBlockTypeName(typeCode);

    // Compression type (2 bytes)
    const compressionCode = buffer.readUInt16LE(offset + 2);
    const compressionType = this.getCompressionType(compressionCode);

    // Uncompressed size (4 bytes)
    const uncompressedSize = buffer.readUInt32LE(offset + 4);

    let compressedSize = uncompressedSize;
    let headerSize = 8;

    // If compressed, read compressed size (additional 4 bytes)
    if (compressionCode > 0) {
      if (offset + 12 > buffer.length) return null;
      compressedSize = buffer.readUInt32LE(offset + 8);
      headerSize = 12;
    }

    // Parse block parameters (after header)
    const parametersOffset = offset + headerSize;
    let parametersSize = 0;
    let parameters = {};

    switch (type) {
      case 'FILE_METADATA':
      case 'PRINTER_METADATA':
      case 'PRINT_METADATA':
      case 'SLICER_METADATA':
      case 'GCODE':
        // Encoding parameter (2 bytes)
        if (parametersOffset + 2 <= buffer.length) {
          const encoding = buffer.readUInt16LE(parametersOffset);
          parameters.encoding = this.getEncodingType(encoding, type);
          parametersSize = 2;
        }
        break;
      case 'THUMBNAIL':
        // Format (2 bytes) + Width (2 bytes) + Height (2 bytes) = 6 bytes
        if (parametersOffset + 6 <= buffer.length) {
          parameters.format = this.getThumbnailFormat(buffer.readUInt16LE(parametersOffset));
          parameters.width = buffer.readUInt16LE(parametersOffset + 2);
          parameters.height = buffer.readUInt16LE(parametersOffset + 4);
          parametersSize = 6;
        }
        break;
    }

    // Calculate checksum size
    const checksumSize = checksumType === 1 ? 4 : 0; // CRC32 = 4 bytes

    // Data size is compressed size (or uncompressed if no compression)
    const dataSize = compressedSize;

    return {
      type,
      typeCode,
      compressionType,
      compressionCode,
      uncompressedSize,
      compressedSize,
      headerSize,
      parametersSize,
      parameters,
      dataSize,
      checksumSize
    };
  }

  /**
   * Get checksum type name
   */
  getChecksumTypeName(code) {
    const types = {
      0: 'None',
      1: 'CRC32'
    };
    return types[code] || `Unknown_${code}`;
  }

  /**
   * Get encoding type name
   */
  getEncodingType(code, blockType) {
    if (blockType === 'GCODE') {
      const types = {
        0: 'None',
        1: 'MeatPack',
        2: 'MeatPack_Comments'
      };
      return types[code] || `Unknown_${code}`;
    } else {
      const types = {
        0: 'INI'
      };
      return types[code] || `Unknown_${code}`;
    }
  }

  /**
   * Get block type name from code
   */
  getBlockTypeName(code) {
    const types = {
      0: 'FILE_METADATA',
      1: 'GCODE',
      2: 'SLICER_METADATA',
      3: 'PRINTER_METADATA',
      4: 'PRINT_METADATA',
      5: 'THUMBNAIL'
    };
    return types[code] || `UNKNOWN_${code}`;
  }

  /**
   * Get compression type from code
   */
  getCompressionType(code) {
    const types = {
      0: 'None',
      1: 'Deflate',
      2: 'Heatshrink_11_4',
      3: 'Heatshrink_12_4'
    };
    return types[code] || `UNKNOWN_${code}`;
  }

  /**
   * Parse metadata block
   */
  parseMetadataBlock(buffer, blockInfo, prefix) {
    try {
      let data = buffer;

      // Decompress if needed
      if (blockInfo.compressionType === 'Deflate') {
        data = zlib.inflateSync(buffer);
      } else if (blockInfo.compressionType !== 'None') {
        console.log(`Unsupported compression: ${blockInfo.compressionType}`);
        return;
      }

      // Parse as INI format (key=value pairs)
      const content = data.toString('utf8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;

        const match = trimmed.match(/^([^=]+?)\s*=\s*(.+)$/);
        if (match) {
          const key = `${prefix}_${match[1].trim()}`;
          const value = match[2].trim();
          this.metadata[key] = this.parseValue(value);
        }
      }
    } catch (error) {
      console.error(`Error parsing ${prefix} metadata: ${error.message}`);
    }
  }

  /**
   * Parse thumbnail block
   */
  parseThumbnailBlock(buffer, blockInfo) {
    try {
      let data = buffer;

      // Decompress if needed
      if (blockInfo.compressionType === 'Deflate') {
        data = zlib.inflateSync(buffer);
      }

      // Use parameters from block header
      const width = blockInfo.parameters.width;
      const height = blockInfo.parameters.height;
      const format = blockInfo.parameters.format;

      if (!this.metadata._thumbnails) {
        this.metadata._thumbnails = [];
      }

      this.metadata._thumbnails.push({
        width,
        height,
        format,
        size: data.length
      });

      console.log(`  Thumbnail: ${width}x${height} ${format} (${data.length} bytes)`);

    } catch (error) {
      console.error(`Error parsing thumbnail: ${error.message}`);
    }
  }

  /**
   * Get thumbnail format from code
   */
  getThumbnailFormat(code) {
    const formats = {
      0: 'PNG',
      1: 'JPG',
      2: 'QOI'
    };
    return formats[code] || `UNKNOWN_${code}`;
  }

  /**
   * Parse value string into appropriate type
   */
  parseValue(value) {
    if (typeof value !== 'string') return value;

    // Handle comma-separated values (take first value for multi-extruder settings)
    if (value.includes(',') && !value.includes(';')) {
      const firstValue = value.split(',')[0].trim();
      return this.parseValue(firstValue); // Recursive parse
    }

    // Handle nil/null
    if (value === 'nil' || value === 'null') return null;

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Try to parse as number
    if (/^-?\d+\.?\d*$/.test(value)) {
      return parseFloat(value);
    }

    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    return value;
  }

  /**
   * Get metadata normalized to PrintJob entity fields
   */
  getNormalizedMetadata() {
    const raw = this.metadata;

    return {
      raw: raw,
      normalized: {
        // Print time fields
        gcodePrintTimeSeconds: this.extractPrintTime(raw),

        // Filament specification
        nozzleDiameterMm: this.extractNumber(raw, [
          'printer_nozzle_diameter',
          'slicer_nozzle_diameter',
          'print_nozzle_diameter'
        ]),

        filamentDiameterMm: this.extractNumber(raw, [
          'printer_filament_diameter',
          'slicer_filament_diameter',
          'print_filament_diameter'
        ]),

        filamentDensityGramsCm3: this.extractNumber(raw, [
          'slicer_filament_density',
          'print_filament_density'
        ]),

        // Filament usage
        filamentUsedMm: this.extractFilamentLength(raw),
        filamentUsedCm3: this.extractFilamentVolume(raw),
        filamentUsedGrams: this.extractFilamentWeight(raw),
        totalFilamentUsedGrams: this.extractTotalFilamentWeight(raw),

        // Additional useful fields
        fileName: raw._fileName,
        layerHeight: this.extractNumber(raw, [
          'printer_layer_height',
          'slicer_layer_height',
          'print_layer_height'
        ]),
        firstLayerHeight: this.extractNumber(raw, ['slicer_first_layer_height']),
        bedTemperature: this.extractNumber(raw, [
          'printer_bed_temperature',
          'slicer_bed_temperature',
          'print_bed_temperature'
        ]),
        nozzleTemperature: this.extractNumber(raw, [
          'printer_temperature',
          'slicer_temperature',
          'print_temperature'
        ]),
        fillDensity: this.extractString(raw, [
          'printer_fill_density',
          'slicer_fill_density'
        ]),
        filamentType: this.extractString(raw, [
          'printer_filament_type',
          'slicer_filament_type',
          'print_filament_type'
        ]),
        printerModel: this.extractString(raw, [
          'printer_printer_model',
          'printer_model',
          'slicer_printer_model'
        ]),
        slicerVersion: this.extractString(raw, [
          'file_Producer',
          'slicer_version',
          'slicer_application'
        ]),
        maxLayerZ: this.extractNumber(raw, [
          'printer_max_layer_z',
          'print_max_layer_z'
        ]),
      }
    };
  }

  extractPrintTime(raw) {
    const keys = [
      'printer_estimated printing time (normal mode)',
      'printer_estimated printing time (silent mode)',
      'print_time',
      'slicer_estimated_printing_time',
      'print_estimated_time'
    ];

    for (const key of keys) {
      if (raw[key]) {
        const value = raw[key];
        if (typeof value === 'number') return value;
        return this.parseTimeToSeconds(value);
      }
    }

    return null;
  }

  parseTimeToSeconds(timeStr) {
    if (typeof timeStr === 'number') return timeStr;
    if (typeof timeStr !== 'string') return null;

    let totalSeconds = 0;

    const hoursMatch = timeStr.match(/(\d+)h/);
    if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;

    const minutesMatch = timeStr.match(/(\d+)m/);
    if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;

    const secondsMatch = timeStr.match(/(\d+)s/);
    if (secondsMatch) totalSeconds += parseInt(secondsMatch[1]);

    return totalSeconds > 0 ? totalSeconds : null;
  }

  extractFilamentLength(raw) {
    return this.extractNumber(raw, [
      'printer_filament used [mm]',
      'print_filament_used_mm',
      'slicer_filament_used_mm',
      'print_filament_used'
    ]);
  }

  extractFilamentVolume(raw) {
    return this.extractNumber(raw, [
      'printer_filament used [cm3]',
      'print_filament_used_cm3',
      'slicer_filament_used_cm3'
    ]);
  }

  extractFilamentWeight(raw) {
    return this.extractNumber(raw, [
      'printer_filament used [g]',
      'print_filament_used_g',
      'slicer_filament_used_g'
    ]);
  }

  extractTotalFilamentWeight(raw) {
    return this.extractNumber(raw, [
      'printer_total filament used [g]',
      'printer_filament used [g]',
      'print_total_filament_used_g',
      'slicer_total_filament_used_g'
    ]);
  }

  extractNumber(raw, keys) {
    for (const key of keys) {
      if (raw[key] !== undefined && raw[key] !== null) {
        const value = raw[key];
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const cleaned = value.replace(/[^\d.-]/g, '');
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed)) return parsed;
        }
      }
    }
    return null;
  }

  extractString(raw, keys) {
    for (const key of keys) {
      if (raw[key] !== undefined && raw[key] !== null) {
        return String(raw[key]);
      }
    }
    return null;
  }
}

// If run directly, parse a file
if (process.argv[1] === new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')) {
  const filePath = process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..', 'Shape-Box_0.4n_0.2mm_PLA_MK4ISMMU3_20m.bgcode');
  const parser = new BGCodeParser();
  const result = parser.parse(filePath);
  console.log('\n=== BGCode Metadata ===');
  console.log(JSON.stringify(result, null, 2));
}

export default BGCodeParser;

