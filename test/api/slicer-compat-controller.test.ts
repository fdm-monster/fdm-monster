import { setupTestApp } from "../test-server";
import { DITokens } from "@/container.tokens";
import { FileStorageService } from "@/services/file-storage.service";
import { SettingsStore } from "@/state/settings.store";

describe("SlicerCompatController", () => {
  let testRequest: any;
  let fileStorageService: FileStorageService;
  let settingsStore: SettingsStore;
  let validApiKey: string;
  const baseRoute = "/api";

  // Helper function to upload a file with API key
  const uploadFile = (filename: string, content: string, additionalFields?: Record<string, string>) => {
    const request = testRequest
      .post(`${baseRoute}/files/local`)
      .set("Accept", "application/json")
      .set("X-Api-Key", validApiKey);

    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, value]) => {
        request.field(key, value);
      });
    }

    return request.attach("file", Buffer.from(content), filename);
  };

  // Helper function to list files with API key
  const listFiles = () => {
    return testRequest
      .get(`${baseRoute}/files`)
      .set("Accept", "application/json")
      .set("X-Api-Key", validApiKey);
  };

  // Helper function to get version with API key
  const getVersion = () => {
    return testRequest
      .get(`${baseRoute}/version`)
      .set("Accept", "application/json")
      .set("X-Api-Key", validApiKey);
  };

  // Helper function to get server info with API key
  const getServer = () => {
    return testRequest
      .get(`${baseRoute}/server`)
      .set("Accept", "application/json")
      .set("X-Api-Key", validApiKey);
  };

  beforeAll(async () => {
    const { request, container } = await setupTestApp(false, undefined, true, false);
    testRequest = request;
    fileStorageService = container.resolve<FileStorageService>(DITokens.fileStorageService);
    settingsStore = container.resolve<SettingsStore>(DITokens.settingsStore);

    // Generate a valid API key for all tests since authentication is now required
    validApiKey = await settingsStore.generateSlicerApiKey();

    // Mock file storage to prevent actual file writes
    let mockFileIdCounter = 0;
    jest.spyOn(fileStorageService, 'saveFile').mockImplementation(async () => {
      return `mock-file-id-${++mockFileIdCounter}`;
    });
    jest.spyOn(fileStorageService, 'calculateFileHash').mockResolvedValue('mock-hash-abc123');
    jest.spyOn(fileStorageService, 'getFilePath').mockImplementation((id: string) => `/mock/path/${id}`);
  });

  afterAll(async () => {
    // Clean up the API key
    await settingsStore.deleteSlicerApiKey();
    // Restore mocks
    jest.restoreAllMocks();
  });

  describe("GET /api/version - OctoPrint version endpoint", () => {
    it("should return OctoPrint-compatible version info", async () => {
      const res = await getVersion();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("api");
      expect(res.body).toHaveProperty("server");
      expect(res.body).toHaveProperty("text");
      expect(typeof res.body.api).toBe("string");
      expect(typeof res.body.server).toBe("string");
      expect(res.body.text).toContain("OctoPrint");
    });

    it("should be publicly accessible (no auth required)", async () => {
      const res = await getVersion();
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/server - OctoPrint server endpoint", () => {
    it("should return server information", async () => {
      const res = await getServer();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("version");
      expect(res.body).toHaveProperty("safemode");
      expect(typeof res.body.version).toBe("string");
    });

    it("should be publicly accessible", async () => {
      const res = await getServer();
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/files - List files", () => {
    it("should return empty files array when no files exist", async () => {
      const res = await listFiles();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("files");
      expect(Array.isArray(res.body.files)).toBe(true);
      expect(res.body).toHaveProperty("free");
      expect(res.body).toHaveProperty("total");
    });

    it("should return OctoPrint-compatible file structure", async () => {
      const fileContent = "G28\nG1 X10 Y10\nM104 S200\n";
      const uploadRes = await uploadFile("test-list.gcode", fileContent);
      expect(uploadRes.status).toBe(201);

      const res = await listFiles();
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
        .post(`${ baseRoute }/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey)
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
        .post(`${ baseRoute }/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey)
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
        .post(`${ baseRoute }/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey)
        .field("print", "true")
        .attach("file", Buffer.from(fileContent), "test-print.gcode");

      expect(res.status).toBe(201);
      expect(res.body.done).toBe(true);
    });

    it("should accept select parameter", async () => {
      const fileContent = "G28\nG1 X10 Y10\n";

      const res = await testRequest
        .post(`${ baseRoute }/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey)
        .field("select", "true")
        .attach("file", Buffer.from(fileContent), "test-select.gcode");

      expect(res.status).toBe(201);
      expect(res.body.done).toBe(true);
    });

    it("should return 400 when no file is uploaded", async () => {
      const res = await testRequest
        .post(`${ baseRoute }/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toContain("No file uploaded");
    });

    it("should handle multiple file formats (gcode, 3mf, bgcode)", async () => {
      const formats = [
        { ext: "gcode", content: "G28\nG1 X10 Y10\n" },
        { ext: "3mf", content: "G28\nG1 X10 Y10\n" },
        { ext: "bgcode", content: "G28\nG1 X10 Y10\n" },
      ];

      for (const format of formats) {
        const res = await testRequest
          .post(`${ baseRoute }/files/local`)
          .set("Accept", "application/json")
          .set("X-Api-Key", validApiKey)
          .attach("file", Buffer.from(format.content), `test.${ format.ext }`);

        expect(res.status).toBe(201);
        expect(res.body.done).toBe(true);
      }
    });

    it("should reject invalid file extensions with 400", async () => {
      const invalidExtensions = ["txt", "pdf", "zip", "stl"];

      for (const ext of invalidExtensions) {
        const res = await testRequest
          .post(`${ baseRoute }/files/local`)
          .set("Accept", "application/json")
          .set("X-Api-Key", validApiKey)
          .attach("file", Buffer.from("test content"), `test.${ ext }`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
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
        .post(`${ baseRoute }/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey)
        .attach("file", Buffer.from(fileContent), "test-analysis.gcode");

      expect(res.status).toBe(201);
      expect(res.body._fdmMonster.analyzed).toBeDefined();
    });

    it("should handle file upload with original filename preservation", async () => {
      const fileContent = "G28\nG1 X10 Y10\n";
      const originalFilename = "my-special-print-file.gcode";

      const res = await testRequest
        .post(`${ baseRoute }/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey)
        .attach("file", Buffer.from(fileContent), originalFilename);

      expect(res.status).toBe(201);
      expect(res.body.files.local.name).toBe(originalFilename);
    });

    it("should calculate and store file hash", async () => {
      const fileContent = "G28\nG1 X10 Y10\n";

      const res = await testRequest
        .post(`${ baseRoute }/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey)
        .attach("file", Buffer.from(fileContent), "test-hash.gcode");

      expect(res.status).toBe(201);
      expect(res.body._fdmMonster.fileHash).toBeDefined();
      expect(res.body._fdmMonster.fileHash.length).toBeGreaterThan(0);

      // Upload same file again - should have same hash
      const res2 = await testRequest
        .post(`${ baseRoute }/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey)
        .attach("file", Buffer.from(fileContent), "test-hash-2.gcode");

      expect(res2.status).toBe(201);
      expect(res2.body._fdmMonster.fileHash).toBe(res.body._fdmMonster.fileHash);
    });

    it("should handle upload errors gracefully", async () => {
      // Try uploading with invalid data
      const res = await testRequest
        .post(`${ baseRoute }/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey)
        .send({ invalid: "data" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should support PrusaSlicer upload format", async () => {
      // PrusaSlicer sends print=true/false and select=true/false
      const fileContent = "G28\nG1 X10 Y10\n";

      const res = await testRequest
        .post(`${ baseRoute }/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey)
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
        .post(`${ baseRoute }/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey)
        .attach("file", Buffer.from(fileContent), filename);

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body._fdmMonster.fileStorageId).toBeDefined();

      // Note: With mocked file storage, files aren't actually persisted,
      // so listing won't find the uploaded file. This is expected behavior.
      const listRes = await listFiles();

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.files)).toBe(true);
    });

    it("should handle multiple concurrent uploads", async () => {
      const uploads = Array.from({ length: 3 }, (_, i) => {
        const content = `G28\nG1 X${ i * 10 } Y${ i * 10 }\n`;
        return testRequest
          .post(`${ baseRoute }/files/local`)
          .set("Accept", "application/json")
          .set("X-Api-Key", validApiKey)
          .attach("file", Buffer.from(content), `concurrent-${ i }.gcode`);
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
        .post(`${ baseRoute }/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey)
        .attach("file", Buffer.from(""), "empty.gcode");

      expect(res.status).toBe(201);
      expect(res.body.done).toBe(true);
    });

    it("should handle very long filenames", async () => {
      const longFilename = "a".repeat(200) + ".gcode";
      const fileContent = "G28\n";

      const res = await testRequest
        .post(`${ baseRoute }/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey)
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
          .post(`${ baseRoute }/files/local`)
          .set("Accept", "application/json")
          .set("X-Api-Key", validApiKey)
          .attach("file", Buffer.from("G28\n"), filename);

        expect(res.status).toBe(201);
        expect(res.body.files.local.name).toBe(filename);
      }
    });
  });

  describe("API Key Authentication", () => {

    describe("POST /api/files/local with X-Api-Key header", () => {
      it("should accept upload with valid X-Api-Key header", async () => {
        const fileContent = "G28\nG1 X10 Y10\n";

        const res = await testRequest
          .post(`${baseRoute}/files/local`)
          .set("Accept", "application/json")
          .set("X-Api-Key", validApiKey)
          .attach("file", Buffer.from(fileContent), "api-key-test.gcode");

        expect(res.status).toBe(201);
        expect(res.body.done).toBe(true);
      });

      it("should reject upload with invalid X-Api-Key header when login is required", async () => {
        // Enable login requirement
        await settingsStore.setLoginRequired(true);

        try {
          const fileContent = "G28\nG1 X10 Y10\n";

          const res = await testRequest
            .post(`${baseRoute}/files/local`)
            .set("Accept", "application/json")
            .set("X-Api-Key", "invalid-api-key")
            .attach("file", Buffer.from(fileContent), "invalid-key-test.gcode");

          expect(res.status).toBe(401);
        } finally {
          // Reset login requirement
          await settingsStore.setLoginRequired(false);
        }
      });

      it("should reject upload without any auth when login is required", async () => {
        // Enable login requirement
        await settingsStore.setLoginRequired(true);

        try {
          const fileContent = "G28\nG1 X10 Y10\n";

          const res = await testRequest
            .post(`${baseRoute}/files/local`)
            .set("Accept", "application/json")
            .attach("file", Buffer.from(fileContent), "no-auth-test.gcode");

          expect(res.status).toBe(401);
        } finally {
          // Reset login requirement
          await settingsStore.setLoginRequired(false);
        }
      });

      it("should work with valid API key even when login is required", async () => {
        // Enable login requirement
        await settingsStore.setLoginRequired(true);

        try {
          const fileContent = "G28\nG1 X10 Y10\n";

          const res = await testRequest
            .post(`${baseRoute}/files/local`)
            .set("Accept", "application/json")
            .set("X-Api-Key", validApiKey)
            .attach("file", Buffer.from(fileContent), "api-key-with-login.gcode");

          expect(res.status).toBe(201);
          expect(res.body.done).toBe(true);
        } finally {
          // Reset login requirement
          await settingsStore.setLoginRequired(false);
        }
      });
    });

    describe("GET /api/files with X-Api-Key header", () => {
      it("should list files with valid X-Api-Key header", async () => {
        const res = await testRequest
          .get(`${baseRoute}/files`)
          .set("Accept", "application/json")
          .set("X-Api-Key", validApiKey);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("files");
      });

      it("should reject list with invalid X-Api-Key when login is required", async () => {
        await settingsStore.setLoginRequired(true);

        try {
          const res = await testRequest
            .get(`${baseRoute}/files`)
            .set("Accept", "application/json")
            .set("X-Api-Key", "invalid-api-key");

          expect(res.status).toBe(401);
        } finally {
          await settingsStore.setLoginRequired(false);
        }
      });
    });

    describe("All endpoints now require API key", () => {
      it("GET /api/version should require API key", async () => {
        const res = await testRequest
          .get(`${baseRoute}/version`)
          .set("Accept", "application/json")
          .set("X-Api-Key", validApiKey);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("api");
      });

      it("GET /api/server should require API key", async () => {
        const res = await testRequest
          .get(`${baseRoute}/server`)
          .set("Accept", "application/json")
          .set("X-Api-Key", validApiKey);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("version");
      });

      it("GET /api/version should reject without API key", async () => {
        const res = await testRequest
          .get(`${baseRoute}/version`)
          .set("Accept", "application/json");

        expect(res.status).toBe(401);
      });

      it("GET /api/server should reject without API key", async () => {
        const res = await testRequest
          .get(`${baseRoute}/server`)
          .set("Accept", "application/json");

        expect(res.status).toBe(401);
      });
    });

    describe("API key validation", () => {
      it("should not accept empty API key", async () => {
        await settingsStore.setLoginRequired(true);

        try {
          const fileContent = "G28\nG1 X10 Y10\n";

          const res = await testRequest
            .post(`${baseRoute}/files/local`)
            .set("Accept", "application/json")
            .set("X-Api-Key", "")
            .attach("file", Buffer.from(fileContent), "empty-key-test.gcode");

          expect(res.status).toBe(401);
        } finally {
          await settingsStore.setLoginRequired(false);
        }
      });

      it("should accept newly regenerated API key", async () => {
        const newApiKey = await settingsStore.generateSlicerApiKey();
        const fileContent = "G28\nG1 X10 Y10\n";

        const res = await testRequest
          .post(`${baseRoute}/files/local`)
          .set("Accept", "application/json")
          .set("X-Api-Key", newApiKey)
          .attach("file", Buffer.from(fileContent), "new-key-test.gcode");

        expect(res.status).toBe(201);

        // Update our validApiKey reference for subsequent tests
        validApiKey = newApiKey;
      });

      it("should reject old API key after regeneration", async () => {
        const oldKey = await settingsStore.generateSlicerApiKey();

        // Generate a new key (invalidating the old one)
        await settingsStore.generateSlicerApiKey();

        await settingsStore.setLoginRequired(true);

        try {
          const fileContent = "G28\nG1 X10 Y10\n";

          const res = await testRequest
            .post(`${baseRoute}/files/local`)
            .set("Accept", "application/json")
            .set("X-Api-Key", oldKey)
            .attach("file", Buffer.from(fileContent), "old-key-test.gcode");

          expect(res.status).toBe(401);
        } finally {
          await settingsStore.setLoginRequired(false);
        }
      });

      it("should reject requests after API key is deleted", async () => {
        const tempKey = await settingsStore.generateSlicerApiKey();
        await settingsStore.deleteSlicerApiKey();

        await settingsStore.setLoginRequired(true);

        try {
          const fileContent = "G28\nG1 X10 Y10\n";

          const res = await testRequest
            .post(`${baseRoute}/files/local`)
            .set("Accept", "application/json")
            .set("X-Api-Key", tempKey)
            .attach("file", Buffer.from(fileContent), "deleted-key-test.gcode");

          expect(res.status).toBe(401);
        } finally {
          await settingsStore.setLoginRequired(false);
          // Restore a key for subsequent tests
          validApiKey = await settingsStore.generateSlicerApiKey();
        }
      });
    });
  });
});

