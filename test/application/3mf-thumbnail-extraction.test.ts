import path from "node:path";
import { setupTestApp } from "../test-server";
import { DITokens } from "@/container.tokens";
import { FileAnalysisService } from "@/services/file-analysis.service";

describe("3MF Thumbnail Extraction", () => {
  let fileAnalysisService: FileAnalysisService;

  beforeAll(async () => {
    const { container } = await setupTestApp(false, undefined, true, false);
    fileAnalysisService = container.resolve<FileAnalysisService>(DITokens.fileAnalysisService);
  });

  it("extracts thumbnails from .3mf file with base64 data", async () => {
    // Create a mock 3MF file with a thumbnail for testing
    const AdmZip = require("adm-zip");
    const zip = new AdmZip();

    // Add a minimal 3dmodel.model file
    zip.addFile(
      "3D/3dmodel.model",
      Buffer.from('<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"></model>', "utf8"),
    );

    // Add a small PNG thumbnail (1x1 red pixel)
    const redPixelPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
      "base64",
    );
    zip.addFile("Metadata/thumbnail_256x256.png", redPixelPng);

    const tmpPath = path.join(__dirname, "..", "api", "test-data", "test-thumbnail-extraction.3mf");
    zip.writeZip(tmpPath);

    try {
      const { metadata, thumbnails } = await fileAnalysisService.analyzeFile(tmpPath);

      // Verify metadata
      expect(metadata.fileFormat).toBe("3mf");

      // Verify thumbnails were extracted - THIS IS THE KEY TEST
      expect(thumbnails.length).toBeGreaterThan(0);

      const thumbnail = thumbnails[0];
      expect(thumbnail.width).toBe(256);
      expect(thumbnail.height).toBe(256);
      expect(thumbnail.format).toBe("PNG");
      expect(thumbnail.data).toBeTruthy(); // Should have base64 data
      expect(thumbnail.data?.length).toBeGreaterThan(0);

      // Verify it's valid base64 and matches our input
      const decoded = Buffer.from(thumbnail.data!, "base64");
      expect(decoded.equals(redPixelPng)).toBe(true);
    } finally {
      const fs = require("fs");
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    }
  });

  it("extracts thumbnails from .bgcode.3mf Bambu file format", async () => {
    const AdmZip = require("adm-zip");
    const zip = new AdmZip();

    // Simulate Bambu Lab 3MF structure with plate gcode
    const plateGcode = `;CONFIG_BLOCK_START
; nozzle_diameter = 0.4
; layer_height = 0.2
; total_layer_count = 100
; total_filament_weight_g = 25.5
; estimated_print_time = 1h 30m
;CONFIG_BLOCK_END

; gcode_file = plate_1.gcode
G28 ; home
`;
    zip.addFile("Metadata/plate_1.gcode", Buffer.from(plateGcode, "utf8"));

    // Add thumbnail
    const thumbnailPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
      "base64",
    );
    zip.addFile("Metadata/plate_1_thumbnail_128x128.png", thumbnailPng);

    const tmpPath = path.join(__dirname, "..", "api", "test-data", "test-bambu-bgcode.3mf");
    zip.writeZip(tmpPath);

    try {
      const { metadata, thumbnails } = await fileAnalysisService.analyzeFile(tmpPath);

      // Verify it's recognized as 3mf
      expect(metadata.fileFormat).toBe("3mf");

      // Verify thumbnails - THIS IS THE KEY TEST
      expect(thumbnails.length).toBeGreaterThan(0);
      const thumbnail = thumbnails[0];
      expect(thumbnail.data).toBeTruthy(); // Should have base64 data now!
      expect(thumbnail.data?.length).toBeGreaterThan(0);
      expect(thumbnail.format).toBe("PNG");

      // Verify dimensions were extracted from filename
      expect(thumbnail.width).toBe(128);
      expect(thumbnail.height).toBe(128);

      // Verify the data matches what we put in
      const decoded = Buffer.from(thumbnail.data!, "base64");
      expect(decoded.equals(thumbnailPng)).toBe(true);
    } finally {
      const fs = require("fs");
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    }
  });
});
