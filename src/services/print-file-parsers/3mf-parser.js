/**
 * 3MF Parser
 * Extracts metadata from Bambu Lab .gcode.3mf files
 *
 * 3MF is a ZIP archive containing:
 * - 3dmodel.model (XML with model data)
 * - Metadata/ folder with slice_info.config and other metadata files
 * - gcode.gcode (actual G-code)
 */

import path from 'node:path';
import AdmZip from 'adm-zip';

export class ThreeMFParser {
  constructor() {
    this.metadata = {};
    this.sliceInfo = {};
    this.modelMetadata = {};
    this.plates = [];
  }

  /**
   * Parse a 3MF file and extract all metadata
   * @param {string} filePath - Path to the 3MF file
   * @returns {Object} Parsed metadata
   */
  parse(filePath) {
    console.log(`\nParsing 3MF file: ${path.basename(filePath)}`);

    this.metadata = {
      _fileName: path.basename(filePath),
      _fileType: '3mf',
      _parseDate: new Date().toISOString(),
    };
    this.plates = [];

    try {
      const zip = new AdmZip(filePath);
      const zipEntries = zip.getEntries();

      console.log(`Found ${zipEntries.length} files in 3MF archive`);

      // List all files for reference
      this.metadata._archiveContents = zipEntries.map(entry => entry.entryName);

      // First, identify all plates
      const plateFiles = {};
      zipEntries.forEach(entry => {
        const plateMatch = entry.entryName.match(/plate_(\d+)\.(gcode|json|png)/);
        if (plateMatch) {
          const plateNum = parseInt(plateMatch[1]);
          if (!plateFiles[plateNum]) {
            plateFiles[plateNum] = { number: plateNum, files: {} };
          }
          plateFiles[plateNum].files[plateMatch[2]] = entry;
        }
      });

      const plateNumbers = Object.keys(plateFiles).map(n => parseInt(n)).sort((a, b) => a - b);
      console.log(`Detected ${plateNumbers.length} plate(s): ${plateNumbers.join(', ')}`);

      // Parse global metadata (shared across plates)
      zipEntries.forEach(entry => {
        const entryName = entry.entryName;

        // Parse slice_info.config (Bambu Lab specific - may contain per-plate data)
        if (entryName === 'Metadata/slice_info.config' || entryName.includes('slice_info')) {
          this.parseSliceInfo(entry.getData().toString('utf8'));
        }

        // Parse model metadata (standard 3MF)
        if (entryName === '3dmodel.model' || entryName.endsWith('.model')) {
          this.parseModelXML(entry.getData().toString('utf8'));
        }

        // Look for global thumbnails
        if ((entryName.includes('thumbnail') || entryName.match(/\.(png|jpg|jpeg)$/i)) &&
            !entryName.match(/plate_\d+/)) {
          if (!this.metadata._thumbnails) {
            this.metadata._thumbnails = [];
          }
          this.metadata._thumbnails.push({
            path: entryName,
            size: entry.header.size
          });
        }
      });

      // Parse each plate
      plateNumbers.forEach(plateNum => {
        const plateData = plateFiles[plateNum];
        const plate = this.parsePlate(plateNum, plateData, zip);
        this.plates.push(plate);
      });

      // Store plate information
      this.metadata._totalPlates = plateNumbers.length;
      this.metadata._isMultiPlate = plateNumbers.length > 1;
      this.metadata.plates = this.plates;

      // For backward compatibility, if single plate, merge into root
      if (plateNumbers.length === 1) {
        this.metadata._plateNumber = plateNumbers[0];
        // Merge first plate's metadata into root for backward compatibility
        const firstPlate = this.plates[0];
        if (firstPlate.metadata.gcode) {
          Object.keys(firstPlate.metadata.gcode).forEach(key => {
            this.metadata[`gcode_${key}`] = firstPlate.metadata.gcode[key];
          });
        }
        if (firstPlate.metadata.json) {
          Object.keys(firstPlate.metadata.json).forEach(key => {
            this.metadata[`plate_${key}`] = firstPlate.metadata.json[key];
          });
        }
      }

      // Merge global metadata sources
      this.metadata = {
        ...this.metadata,
        ...this.sliceInfo,
        ...this.modelMetadata
      };

    } catch (error) {
      console.error(`Error parsing 3MF file: ${error.message}`);
      this.metadata._error = error.message;
    }

    return this.getNormalizedMetadata();
  }

  /**
   * Parse individual plate metadata
   * @param {number} plateNum - Plate number
   * @param {Object} plateData - Plate file data
   * @param {AdmZip} zip - ZIP archive
   * @returns {Object} Plate metadata
   */
  parsePlate(plateNum, plateData, zip) {
    console.log(`Parsing plate ${plateNum}...`);

    const plate = {
      plateNumber: plateNum,
      metadata: {},
      thumbnails: []
    };

    // Parse G-code header
    if (plateData.files.gcode) {
      const gcodeContent = plateData.files.gcode.getData().toString('utf8');
      const gcodeMetadata = {};

      // Parse first 200 lines
      const lines = gcodeContent.split('\n').slice(0, 200);
      let parsed = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith(';')) continue;

        const cleanLine = trimmed.substring(1).trim();

        // Parse "key: value" format
        let match = cleanLine.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          gcodeMetadata[key] = this.parseValue(value);
          parsed++;
          continue;
        }

        // Parse "key = value" format
        match = cleanLine.match(/^([^=]+?)\s*=\s*(.+)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          gcodeMetadata[key] = this.parseValue(value);
          parsed++;
        }
      }

      plate.metadata.gcode = gcodeMetadata;
      console.log(`  Parsed ${parsed} G-code metadata lines`);
    }

    // Parse plate JSON
    if (plateData.files.json) {
      try {
        const json = JSON.parse(plateData.files.json.getData().toString('utf8'));
        plate.metadata.json = json;
      } catch (e) {
        console.error(`  Error parsing plate ${plateNum} JSON:`, e.message);
      }
    }

    // Collect thumbnails
    const allEntries = zip.getEntries();
    allEntries.forEach(entry => {
      const thumbnailMatch = entry.entryName.match(/plate_(\d+)[^/]*\.(png|jpg|jpeg)/i);
      if (thumbnailMatch && parseInt(thumbnailMatch[1]) === plateNum) {
        plate.thumbnails.push({
          path: entry.entryName,
          size: entry.header.size,
          type: thumbnailMatch[2]
        });
      }
    });

    return plate;
  }

  /**
   * Parse Bambu Lab slice_info.config file (XML format)
   * @param {string} content - File content
   */
  parseSliceInfo(content) {
    console.log('Parsing slice_info.config');

    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Format: key = value
      const match = trimmed.match(/^([^=]+?)\s*=\s*(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        this.sliceInfo[key] = this.parseValue(value);
      }
    }
  }

  /**
   * Parse 3MF model XML for metadata
   * @param {string} content - XML content
   */
  parseModelXML(content) {
    console.log('Parsing 3dmodel.model XML');

    // Simple XML metadata extraction (without full XML parser)
    // Look for metadata elements
    const metadataRegex = /<metadata\s+name="([^"]+)">([^<]*)<\/metadata>/gi;
    let match;

    while ((match = metadataRegex.exec(content)) !== null) {
      const key = match[1];
      const value = match[2];
      this.modelMetadata[`model_${key}`] = this.parseValue(value);
    }

    // Look for custom metadata (Bambu specific)
    const customMetadataRegex = /<([a-zA-Z_][a-zA-Z0-9_:]*)\s+name="([^"]+)">([^<]*)<\/\1>/gi;
    while ((match = customMetadataRegex.exec(content)) !== null) {
      if (match[1].includes('meta')) {
        const key = match[2];
        const value = match[3];
        this.modelMetadata[`custom_${key}`] = this.parseValue(value);
      }
    }
  }

  /**
   * Parse G-code header for metadata
   * @param {string} content - G-code content
   */
  parseGCodeHeader(content) {
    console.log('Parsing G-code header');

    // Only parse first 200 lines (header section)
    const lines = content.split('\n').slice(0, 200);
    let parsed = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith(';')) continue;

      // Remove leading semicolon and whitespace
      const cleanLine = trimmed.substring(1).trim();

      // Parse "key: value" format (Bambu uses this in header)
      let match = cleanLine.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        this.metadata[`gcode_${key}`] = this.parseValue(value);
        parsed++;
        continue;
      }

      // Parse "key = value" format
      match = cleanLine.match(/^([^=]+?)\s*=\s*(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        this.metadata[`gcode_${key}`] = this.parseValue(value);
        parsed++;
      }
    }

    console.log(`Parsed ${parsed} G-code metadata lines`);
  }

  /**
   * Parse a value string into appropriate type
   * @param {string} value - Value string to parse
   * @returns {any} Parsed value
   */
  parseValue(value) {
    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    // Try to parse as number
    if (/^-?\d+\.?\d*$/.test(value)) {
      return parseFloat(value);
    }

    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Try to parse as JSON
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value);
      } catch (e) {
        // Not valid JSON
      }
    }

    return value;
  }

  /**
   * Get metadata normalized to PrintJob entity fields
   * @returns {Object} Normalized metadata with plates array
   */
  getNormalizedMetadata() {
    const raw = this.metadata;

    // Base normalized metadata (for single plate or shared data)
    const baseNormalized = {
      // Print time fields
      gcodePrintTimeSeconds: this.extractPrintTime(raw),

      // Filament specification
      nozzleDiameterMm: this.extractNumber(raw, [
        'nozzle_diameters',
        'plate_nozzle_diameter',
        'nozzle_diameter',
        'nozzle_diameter_0',
        'machine_nozzle_size'
      ]),

      filamentDiameterMm: this.extractNumber(raw, [
        'gcode_filament_diameter',
        'filament_diameter',
        'filament_diameter_0',
        'material_diameter'
      ]),

      filamentDensityGramsCm3: this.extractNumber(raw, [
        'gcode_filament_density',
        'filament_density',
        'filament_density_0',
        'material_density'
      ]),

      // Filament usage
      filamentUsedMm: this.extractFilamentLength(raw),
      filamentUsedCm3: this.extractFilamentVolume(raw),
      filamentUsedGrams: this.extractFilamentWeight(raw),
      totalFilamentUsedGrams: this.extractTotalFilamentWeight(raw),

      // Additional useful fields
      fileName: raw._fileName,
      layerHeight: this.extractNumber(raw, [
        'plate_layer_height',
        'gcode_layer_height',
        'layer_height',
        'layer_height_0'
      ]),
      firstLayerHeight: this.extractNumber(raw, [
        'first_layer_time',
        'first_layer_height',
        'initial_layer_height'
      ]),
      bedTemperature: this.extractNumber(raw, [
        'gcode_bed_temperature',
        'bed_temperature',
        'bed_temperature_0',
        'hot_plate_temp',
        'bed_temp_initial_layer'
      ]),
      nozzleTemperature: this.extractNumber(raw, [
        'gcode_nozzle_temperature',
        'nozzle_temperature',
        'nozzle_temperature_0',
        'temperature',
        'nozzle_temp_initial_layer'
      ]),
      fillDensity: this.extractString(raw, [
        'gcode_sparse_infill_density',
        'sparse_infill_density',
        'fill_density'
      ]),
      filamentType: this.extractString(raw, [
        'gcode_filament_type',
        'filament_type',
        'filament_type_0',
        'material_type'
      ]),
      printerModel: this.extractString(raw, [
        'printer_model_id',
        'printer_model',
        'machine_name',
        'printer_variant'
      ]),
      slicerVersion: this.extractString(raw, [
        'model_Application',
        'slicer_version',
        'orca_slicer_version',
        'bambu_studio_version'
      ]),
      maxLayerZ: this.extractNumber(raw, [
        'gcode_max_z_height',
        'max_layer_z',
        'total_layer_count'
      ]),

      // Multi-plate fields
      plateNumber: raw._plateNumber,
      totalPlates: raw._totalPlates || 1,
      isMultiPlate: raw._isMultiPlate || false,
      totalLayers: this.extractNumber(raw, [
        'gcode_total layer number',
        'total_layer_count',
        'layer_count'
      ]),
    };

    // If multi-plate, normalize each plate
    const result = {
      raw: raw,
      normalized: baseNormalized
    };

    if (raw._isMultiPlate && this.plates.length > 1) {
      result.plates = this.plates.map(plate => this.normalizePlate(plate));
    }

    return result;
  }

  /**
   * Normalize individual plate data
   * @param {Object} plate - Plate data
   * @returns {Object} Normalized plate metadata
   */
  normalizePlate(plate) {
    const gcodeData = plate.metadata.gcode || {};
    const jsonData = plate.metadata.json || {};

    return {
      plateNumber: plate.plateNumber,

      // Print time
      gcodePrintTimeSeconds: this.extractPrintTimeFromPlate(gcodeData),

      // Filament data
      nozzleDiameterMm: jsonData.nozzle_diameter || null,
      filamentDiameterMm: gcodeData['filament_diameter'] || null,
      filamentDensityGramsCm3: gcodeData['filament_density'] || null,
      filamentUsedMm: gcodeData['total filament length [mm]'] || null,
      filamentUsedCm3: gcodeData['total filament volume [cm^3]'] || null,
      filamentUsedGrams: gcodeData['total filament weight [g]'] || null,
      totalFilamentUsedGrams: gcodeData['total filament weight [g]'] || null,

      // Layer info
      layerHeight: jsonData.bbox_objects?.[0]?.layer_height || null,
      firstLayerTime: jsonData.first_layer_time || null,
      totalLayers: gcodeData['total layer number'] || null,
      maxLayerZ: gcodeData['max_z_height'] || null,

      // Other fields
      filamentType: gcodeData['filament_type'] || null,
      bedType: jsonData.bed_type || null,
      isSeqPrint: jsonData.is_seq_print || false,
      filamentColors: jsonData.filament_colors || [],

      // Thumbnails
      thumbnails: plate.thumbnails,

      // Object info
      objects: jsonData.bbox_objects || []
    };
  }

  /**
   * Extract print time from plate G-code metadata
   */
  extractPrintTimeFromPlate(gcodeData) {
    const timeStr = gcodeData['model printing time'];
    if (timeStr) {
      const firstTime = timeStr.split(';')[0].trim();
      return this.parseTimeToSeconds(firstTime);
    }
    return null;
  }

  extractPrintTime(raw) {
    // Bambu uses 'prediction' in seconds in slice_info.config
    const prediction = this.extractNumber(raw, ['prediction']);
    if (prediction) return prediction;

    // Or 'time_cost' in seconds
    const timeCost = this.extractNumber(raw, ['time_cost', 'print_time', 'estimated_time']);
    if (timeCost) return timeCost;

    // Try parsing from gcode header comments (e.g., "11m 15s; total estimated time: 18m 15s")
    const gcodeTime = this.extractString(raw, [
      'gcode_model printing time',
      'gcode_total estimated time',
      'estimated_print_time'
    ]);
    if (gcodeTime) {
      // Extract the first time value before any semicolon
      const firstTime = gcodeTime.split(';')[0].trim();
      return this.parseTimeToSeconds(firstTime);
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
    // Bambu G-code header has 'total filament length [mm]'
    let value = this.extractNumber(raw, [
      'gcode_total filament length [mm]',
      'filament_used_mm',
      'total_filament_used_mm',
      'filament_used_0'
    ]);

    if (value) return value;

    // Check if in meters (from filament tag: used_m)
    value = this.extractNumber(raw, ['filament_used_m', 'filament_used']);
    if (value) return value * 1000; // Convert to mm

    return null;
  }

  extractFilamentVolume(raw) {
    // Bambu G-code header has 'total filament volume [cm^3]'
    return this.extractNumber(raw, [
      'gcode_total filament volume [cm^3]',
      'filament_used_cm3',
      'filament_volume',
      'total_volume'
    ]);
  }

  extractFilamentWeight(raw) {
    // Bambu uses 'weight' in slice_info or 'total filament weight [g]' in gcode
    return this.extractNumber(raw, [
      'weight',
      'gcode_total filament weight [g]',
      'filament_used_g',
      'filament_weight',
      'total_filament_weight'
    ]);
  }

  extractTotalFilamentWeight(raw) {
    // Same as filamentWeight for Bambu
    return this.extractNumber(raw, [
      'weight',
      'gcode_total filament weight [g]',
      'total_filament_used_g',
      'total_weight',
      'filament_weight'
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
  const filePath = process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..', 'bambu.gcode.3mf');
  const parser = new ThreeMFParser();
  const result = parser.parse(filePath);
  console.log('\n=== 3MF Metadata ===');
  console.log(JSON.stringify(result, null, 2));
}

export default ThreeMFParser;

