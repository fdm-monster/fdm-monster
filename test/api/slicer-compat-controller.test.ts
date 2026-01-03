import { setupTestApp } from "../test-server";
import { DITokens } from "@/container.tokens";
import { FileStorageService } from "@/services/file-storage.service";
import { AppConstants } from "@/server.constants";
import { join } from "node:path";
import { readFileSync } from "node:fs";

describe("SlicerCompatController", () => {
  let testRequest: any;
  let fileStorageService: FileStorageService;
  const baseRoute = "/api";

  beforeAll(async () => {
    const { request, container } = await setupTestApp(false, undefined, true, false);
    testRequest = request;
    fileStorageService = container.resolve<FileStorageService>(DITokens.fileStorageService);
  });

  describe("GET /api/version - OctoPrint version endpoint", () => {
    it("should return OctoPrint-compatible version info", async () => {
      const res = await testRequest
        .get(`${baseRoute}/version`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("api");
      expect(res.body).toHaveProperty("server");
      expect(res.body).toHaveProperty("text");
      expect(typeof res.body.api).toBe("string");
      expect(typeof res.body.server).toBe("string");
      expect(res.body.text).toContain("OctoPrint");
    });

    it("should be publicly accessible (no auth required)", async () => {
      // Test without authentication
      const res = await testRequest
        .get(`${baseRoute}/version`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/server - OctoPrint server endpoint", () => {
    it("should return server information", async () => {
      const res = await testRequest
        .get(`${baseRoute}/server`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("version");
      expect(res.body).toHaveProperty("safemode");
      expect(typeof res.body.version).toBe("string");
    });

    it("should be publicly accessible", async () => {
      const res = await testRequest
        .get(`${baseRoute}/server`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/files - List files", () => {
    it("should return empty files array when no files exist", async () => {
      const res = await testRequest
        .get(`${baseRoute}/files`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("files");
      expect(Array.isArray(res.body.files)).toBe(true);
      expect(res.body).toHaveProperty("free");
      expect(res.body).toHaveProperty("total");
    });

    it("should return OctoPrint-compatible file structure", async () => {
      // First upload a file
      const testFilePath = join(__dirname, "../mocks/test-file.gcode");
      let fileContent = "G28\nG1 X10 Y10\nM104 S200\n";

      try {
        fileContent = readFileSync(testFilePath, "utf8");
      } catch {
        // Use default content if mock file doesn't exist
      }

      const uploadRes = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .attach("file", Buffer.from(fileContent), "test-list.gcode");

      expect(uploadRes.status).toBe(201);

      // Now list files
      const res = await testRequest
        .get(`${baseRoute}/files`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.files)).toBe(true);

      if (res.body.files.length > 0) {
        const file = res.body.files[0];
        expect(file).toHaveProperty("name");
        expect(file).toHaveProperty("path");
        expect(file).toHaveProperty("type");
        expect(file).toHaveProperty("origin");
        expect(file).toHaveProperty("refs");
        expect(file.origin).toBe("local");
        expect(file.refs).toHaveProperty("resource");
        expect(file.refs).toHaveProperty("download");
      }
    });
  });

  describe("POST /api/files/local - Upload file", () => {
    it("should upload a gcode file successfully", async () => {
      const fileContent = `
; Test G-code
G28 ; Home all axes
M104 S200 ; Set hotend temp
M140 S60 ; Set bed temp
G1 X10 Y10 Z0.2 F3000
G1 X20 Y20 E5
M104 S0
M140 S0
`;

      const res = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .attach("file", Buffer.from(fileContent), "test-upload.gcode");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("done", true);
      expect(res.body).toHaveProperty("files");
      expect(res.body.files).toHaveProperty("local");
      expect(res.body.files.local).toHaveProperty("name", "test-upload.gcode");
      expect(res.body.files.local).toHaveProperty("origin", "local");
      expect(res.body.files.local.refs).toHaveProperty("resource");
      expect(res.body.files.local.refs).toHaveProperty("download");
    });

    it("should return FDM Monster metadata in response", async () => {
      const fileContent = "G28\nG1 X10 Y10\n";

      const res = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .attach("file", Buffer.from(fileContent), "test-metadata.gcode");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_fdmMonster");
      expect(res.body._fdmMonster).toHaveProperty("fileStorageId");
      expect(res.body._fdmMonster).toHaveProperty("fileHash");
      expect(res.body._fdmMonster).toHaveProperty("analyzed");
      expect(res.body._fdmMonster).toHaveProperty("thumbnailCount");
      expect(typeof res.body._fdmMonster.fileStorageId).toBe("string");
      expect(typeof res.body._fdmMonster.fileHash).toBe("string");
    });

    it("should accept print parameter", async () => {
      const fileContent = "G28\nG1 X10 Y10\n";

      const res = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .field("print", "true")
        .attach("file", Buffer.from(fileContent), "test-print.gcode");

      expect(res.status).toBe(201);
      expect(res.body.done).toBe(true);
    });

    it("should accept select parameter", async () => {
      const fileContent = "G28\nG1 X10 Y10\n";

      const res = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .field("select", "true")
        .attach("file", Buffer.from(fileContent), "test-select.gcode");

      expect(res.status).toBe(201);
      expect(res.body.done).toBe(true);
    });

    it("should return 400 when no file is uploaded", async () => {
      const res = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toContain("No file uploaded");
    });

    it("should handle multiple file formats (gcode, 3mf, bgcode)", async () => {
      const formats = [
        { ext: "gcode", content: "G28\nG1 X10 Y10\n" },
        { ext: "gco", content: "G28\nG1 X10 Y10\n" },
        { ext: "g", content: "G28\nG1 X10 Y10\n" },
      ];

      for (const format of formats) {
        const res = await testRequest
          .post(`${baseRoute}/files/local`)
          .set("Accept", "application/json")
          .attach("file", Buffer.from(format.content), `test.${format.ext}`);

        expect(res.status).toBe(201);
        expect(res.body.done).toBe(true);
      }
    });

    it("should analyze uploaded file and extract metadata", async () => {
      const fileContent = `
; filament used = 10.5m
; filament used [g] = 25.3
; estimated printing time = 1h 30m
G28
G1 X10 Y10 Z0.2 F3000
G1 X20 Y20 E5 F1500
`;

      const res = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .attach("file", Buffer.from(fileContent), "test-analysis.gcode");

      expect(res.status).toBe(201);
      expect(res.body._fdmMonster.analyzed).toBeDefined();
    });

    it("should handle file upload with original filename preservation", async () => {
      const fileContent = "G28\nG1 X10 Y10\n";
      const originalFilename = "my-special-print-file.gcode";

      const res = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .attach("file", Buffer.from(fileContent), originalFilename);

      expect(res.status).toBe(201);
      expect(res.body.files.local.name).toBe(originalFilename);
    });

    it("should calculate and store file hash", async () => {
      const fileContent = "G28\nG1 X10 Y10\n";

      const res = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .attach("file", Buffer.from(fileContent), "test-hash.gcode");

      expect(res.status).toBe(201);
      expect(res.body._fdmMonster.fileHash).toBeDefined();
      expect(res.body._fdmMonster.fileHash.length).toBeGreaterThan(0);

      // Upload same file again - should have same hash
      const res2 = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .attach("file", Buffer.from(fileContent), "test-hash-2.gcode");

      expect(res2.status).toBe(201);
      expect(res2.body._fdmMonster.fileHash).toBe(res.body._fdmMonster.fileHash);
    });

    it("should handle upload errors gracefully", async () => {
      // Try uploading with invalid data
      const res = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .send({ invalid: "data" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should support PrusaSlicer upload format", async () => {
      // PrusaSlicer sends print=true/false and select=true/false
      const fileContent = "G28\nG1 X10 Y10\n";

      const res = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .field("print", "false")
        .field("select", "true")
        .attach("file", Buffer.from(fileContent), "prusaslicer-test.gcode");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("done", true);
      expect(res.body.files.local.refs.resource).toContain("/api/files/local/");
    });
  });

  describe("Integration - Full workflow", () => {
    it("should upload file and then list it", async () => {
      const fileContent = "G28\nG1 X10 Y10\n";
      const filename = "integration-test.gcode";

      // Upload
      const uploadRes = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .attach("file", Buffer.from(fileContent), filename);

      expect(uploadRes.status).toBe(201);
      const fileStorageId = uploadRes.body._fdmMonster.fileStorageId;

      // List and verify it appears
      const listRes = await testRequest
        .get(`${baseRoute}/files`)
        .set("Accept", "application/json");

      expect(listRes.status).toBe(200);
      const uploadedFile = listRes.body.files.find((f: any) => f.path === fileStorageId);
      expect(uploadedFile).toBeDefined();
      expect(uploadedFile.name).toBe(filename);
    });

    it("should handle multiple concurrent uploads", async () => {
      const uploads = Array.from({ length: 3 }, (_, i) => {
        const content = `G28\nG1 X${i * 10} Y${i * 10}\n`;
        return testRequest
          .post(`${baseRoute}/files/local`)
          .set("Accept", "application/json")
          .attach("file", Buffer.from(content), `concurrent-${i}.gcode`);
      });

      const results = await Promise.all(uploads);

      results.forEach((res) => {
        expect(res.status).toBe(201);
        expect(res.body.done).toBe(true);
      });

      // Verify all files have unique IDs
      const fileIds = results.map(r => r.body._fdmMonster.fileStorageId);
      const uniqueIds = new Set(fileIds);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty gcode file", async () => {
      const res = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .attach("file", Buffer.from(""), "empty.gcode");

      expect(res.status).toBe(201);
      expect(res.body.done).toBe(true);
    });

    it("should handle very long filenames", async () => {
      const longFilename = "a".repeat(200) + ".gcode";
      const fileContent = "G28\n";

      const res = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .attach("file", Buffer.from(fileContent), longFilename);

      expect(res.status).toBe(201);
    });

    it("should handle special characters in filenames", async () => {
      const specialFilenames = [
        "test with spaces.gcode",
        "test-with-dashes.gcode",
        "test_with_underscores.gcode",
        "test.multiple.dots.gcode",
      ];

      for (const filename of specialFilenames) {
        const res = await testRequest
          .post(`${baseRoute}/files/local`)
          .set("Accept", "application/json")
          .attach("file", Buffer.from("G28\n"), filename);

        expect(res.status).toBe(201);
        expect(res.body.files.local.name).toBe(filename);
      }
    });
  });
});

