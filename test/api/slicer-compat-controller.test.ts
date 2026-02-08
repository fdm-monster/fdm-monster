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

  // Common test data
  const SIMPLE_GCODE = "G28\nG1 X10 Y10\n";
  const DETAILED_GCODE = `
; Test G-code
G28 ; Home all axes
M104 S200 ; Set hotend temp
M140 S60 ; Set bed temp
G1 X10 Y10 Z0.2 F3000
G1 X20 Y20 E5
M104 S0
M140 S0
`;

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

  const uploadFileWithoutAuth = (filename: string, content: string) => {
    return testRequest
      .post(`${baseRoute}/files/local`)
      .set("Accept", "application/json")
      .attach("file", Buffer.from(content), filename);
  };

  const uploadFileWithApiKey = (filename: string, content: string, apiKey: string) => {
    return testRequest
      .post(`${baseRoute}/files/local`)
      .set("Accept", "application/json")
      .set("X-Api-Key", apiKey)
      .attach("file", Buffer.from(content), filename);
  };

  const listFiles = () => {
    return testRequest.get(`${baseRoute}/files`).set("Accept", "application/json").set("X-Api-Key", validApiKey);
  };

  const getVersion = () => {
    return testRequest.get(`${baseRoute}/version`).set("Accept", "application/json").set("X-Api-Key", validApiKey);
  };

  // Helper to get server info
  const getServer = () => {
    return testRequest.get(`${baseRoute}/server`).set("Accept", "application/json").set("X-Api-Key", validApiKey);
  };

  // Helper for common upload response assertions
  const expectSuccessfulUpload = (response: any, filename: string) => {
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("done", true);
    expect(response.body).toHaveProperty("files");
    expect(response.body.files.local).toHaveProperty("name", filename);
    expect(response.body.files.local).toHaveProperty("origin", "local");
  };

  // Helper to run a test with login required
  const withLoginRequired = async (testFn: () => Promise<void>) => {
    await settingsStore.setLoginRequired(true);
    try {
      await testFn();
    } finally {
      await settingsStore.setLoginRequired(false);
    }
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
    const uploadedFilenames: Map<string, string> = new Map(); // Track uploaded filenames

    jest.spyOn(fileStorageService, "saveFile").mockImplementation(async (file) => {
      const fileId = `mock-file-id-${++mockFileIdCounter}`;
      uploadedFilenames.set(file.originalname, fileId);
      return fileId;
    });
    jest.spyOn(fileStorageService, "calculateFileHash").mockResolvedValue("mock-hash-abc123");
    jest.spyOn(fileStorageService, "getFilePath").mockImplementation((id: string) => `/mock/path/${id}`);
    jest.spyOn(fileStorageService, "findDuplicateByOriginalFileName").mockImplementation(async (filename: string) => {
      const existingFileId = uploadedFilenames.get(filename);
      if (existingFileId) {
        return {
          fileStorageId: existingFileId,
          metadata: { _originalFileName: filename },
        };
      }
      return null;
    });
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
      const res = await uploadFile("test-upload.gcode", DETAILED_GCODE);

      expectSuccessfulUpload(res, "test-upload.gcode");
      expect(res.body.files.local.refs).toHaveProperty("resource");
      expect(res.body.files.local.refs).toHaveProperty("download");
    });

    it("should return FDM Monster metadata in response", async () => {
      const res = await uploadFile("test-metadata.gcode", SIMPLE_GCODE);

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
      const res = await uploadFile("test-print.gcode", SIMPLE_GCODE, { print: "true" });

      expect(res.status).toBe(201);
      expect(res.body.done).toBe(true);
    });

    it("should accept select parameter", async () => {
      const res = await uploadFile("test-select.gcode", SIMPLE_GCODE, { select: "true" });

      expect(res.status).toBe(201);
      expect(res.body.done).toBe(true);
    });

    it("should return 400 when no file is uploaded", async () => {
      const res = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toContain("No file uploaded");
    });

    it("should handle multiple file formats (gcode, 3mf, bgcode)", async () => {
      const formats = ["gcode", "3mf", "bgcode"];

      for (const ext of formats) {
        const res = await uploadFile(`test.${ext}`, SIMPLE_GCODE);
        expect(res.status).toBe(201);
        expect(res.body.done).toBe(true);
      }
    });

    it("should reject invalid file extensions with 400", async () => {
      const invalidExtensions = ["txt", "pdf", "zip", "stl"];

      for (const ext of invalidExtensions) {
        const res = await uploadFile(`test.${ext}`, "test content");
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

      const res = await uploadFile("test-analysis.gcode", fileContent);

      expect(res.status).toBe(201);
      expect(res.body._fdmMonster.analyzed).toBeDefined();
    });

    it("should handle file upload with original filename preservation", async () => {
      const originalFilename = "my-special-print-file.gcode";
      const res = await uploadFile(originalFilename, SIMPLE_GCODE);

      expect(res.status).toBe(201);
      expect(res.body.files.local.name).toBe(originalFilename);
    });

    it("should calculate and store file hash", async () => {
      const res = await uploadFile("test-hash.gcode", SIMPLE_GCODE);

      expect(res.status).toBe(201);
      expect(res.body._fdmMonster.fileHash).toBeDefined();
      expect(res.body._fdmMonster.fileHash.length).toBeGreaterThan(0);

      const res2 = await uploadFile("test-hash-2.gcode", SIMPLE_GCODE);

      expect(res2.status).toBe(201);
      expect(res2.body._fdmMonster.fileHash).toBe(res.body._fdmMonster.fileHash);
    });

    it("should handle upload errors gracefully", async () => {
      // Try uploading with invalid data
      const res = await testRequest
        .post(`${baseRoute}/files/local`)
        .set("Accept", "application/json")
        .set("X-Api-Key", validApiKey)
        .send({ invalid: "data" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should support PrusaSlicer upload format", async () => {
      const res = await uploadFile("prusaslicer-test.gcode", SIMPLE_GCODE, {
        print: "false",
        select: "true",
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("done", true);
      expect(res.body.files.local.refs.resource).toContain("/api/files/local/");
    });

    it("should reject duplicate filename uploads", async () => {
      const filename = "duplicate-test.gcode";
      const content1 = "G28\nG1 X10 Y10\n";
      const content2 = "G28\nG1 X20 Y20\n";

      const res1 = await uploadFile(filename, content1);
      expect(res1.status).toBe(201);
      expect(res1.body.done).toBe(true);

      const res2 = await uploadFile(filename, content2);
      expect(res2.status).toBe(409);
      expect(res2.body).toHaveProperty("error");
      expect(res2.body.error).toContain("already exists");
      expect(res2.body.error).toContain(filename);
      expect(res2.body).toHaveProperty("existingResourceId");
      expect(res2.body.existingResourceId).toBeDefined();
    });
  });

  describe("Integration - Full workflow", () => {
    it("should upload file and then list it", async () => {
      const uploadRes = await uploadFile("integration-test.gcode", SIMPLE_GCODE);

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body._fdmMonster.fileStorageId).toBeDefined();

      const listRes = await listFiles();

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.files)).toBe(true);
    });

    it("should handle multiple concurrent uploads", async () => {
      const uploads = Array.from({ length: 3 }, (_, i) =>
        uploadFile(`concurrent-${i}.gcode`, `G28\nG1 X${i * 10} Y${i * 10}\n`),
      );

      const results = await Promise.all(uploads);

      results.forEach((res) => {
        expect(res.status).toBe(201);
        expect(res.body.done).toBe(true);
      });

      const fileIds = results.map((r) => r.body._fdmMonster.fileStorageId);
      const uniqueIds = new Set(fileIds);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty gcode file", async () => {
      const res = await uploadFile("empty.gcode", "");

      expect(res.status).toBe(201);
      expect(res.body.done).toBe(true);
    });

    it("should handle very long filenames", async () => {
      const longFilename = "a".repeat(200) + ".gcode";
      const res = await uploadFile(longFilename, "G28\n");

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
        const res = await uploadFile(filename, "G28\n");
        expect(res.status).toBe(201);
        expect(res.body.files.local.name).toBe(filename);
      }
    });
  });

  describe("API Key Authentication", () => {
    describe("POST /api/files/local with X-Api-Key header", () => {
      it("should accept upload with valid X-Api-Key header", async () => {
        const res = await uploadFile("api-key-test.gcode", SIMPLE_GCODE);

        expect(res.status).toBe(201);
        expect(res.body.done).toBe(true);
      });

      it("should reject upload with invalid X-Api-Key header when login is required", async () => {
        await withLoginRequired(async () => {
          const res = await uploadFileWithApiKey("invalid-key-test.gcode", SIMPLE_GCODE, "invalid-api-key");
          expect(res.status).toBe(401);
        });
      });

      it("should reject upload without any auth when login is required", async () => {
        await withLoginRequired(async () => {
          const res = await uploadFileWithoutAuth("no-auth-test.gcode", SIMPLE_GCODE);
          expect(res.status).toBe(401);
        });
      });

      it("should work with valid API key even when login is required", async () => {
        await withLoginRequired(async () => {
          const res = await uploadFile("api-key-with-login.gcode", SIMPLE_GCODE);

          expect(res.status).toBe(201);
          expect(res.body.done).toBe(true);
        });
      });
    });

    describe("GET /api/files with X-Api-Key header", () => {
      it("should list files with valid X-Api-Key header", async () => {
        const res = await listFiles();

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("files");
      });

      it("should reject list with invalid X-Api-Key when login is required", async () => {
        await withLoginRequired(async () => {
          const res = await testRequest
            .get(`${baseRoute}/files`)
            .set("Accept", "application/json")
            .set("X-Api-Key", "invalid-api-key");

          expect(res.status).toBe(401);
        });
      });
    });

    describe("All endpoints now require API key", () => {
      it("GET /api/version should require API key", async () => {
        const res = await getVersion();

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("api");
      });

      it("GET /api/server should require API key", async () => {
        const res = await getServer();

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("version");
      });

      it("GET /api/version should reject without API key", async () => {
        const res = await testRequest.get(`${baseRoute}/version`).set("Accept", "application/json");

        expect(res.status).toBe(401);
      });

      it("GET /api/server should reject without API key", async () => {
        const res = await testRequest.get(`${baseRoute}/server`).set("Accept", "application/json");

        expect(res.status).toBe(401);
      });
    });

    describe("API key validation", () => {
      it("should not accept empty API key", async () => {
        await withLoginRequired(async () => {
          const res = await uploadFileWithApiKey("empty-key-test.gcode", SIMPLE_GCODE, "");
          expect(res.status).toBe(401);
        });
      });

      it("should accept newly regenerated API key", async () => {
        const newApiKey = await settingsStore.generateSlicerApiKey();
        const res = await uploadFileWithApiKey("new-key-test.gcode", SIMPLE_GCODE, newApiKey);

        expect(res.status).toBe(201);
        validApiKey = newApiKey;
      });

      it("should reject old API key after regeneration", async () => {
        const oldKey = await settingsStore.generateSlicerApiKey();
        await settingsStore.generateSlicerApiKey();

        await withLoginRequired(async () => {
          const res = await uploadFileWithApiKey("old-key-test.gcode", SIMPLE_GCODE, oldKey);
          expect(res.status).toBe(401);
        });
      });

      it("should reject requests after API key is deleted", async () => {
        const tempKey = await settingsStore.generateSlicerApiKey();
        await settingsStore.deleteSlicerApiKey();

        await withLoginRequired(async () => {
          const res = await uploadFileWithApiKey("deleted-key-test.gcode", SIMPLE_GCODE, tempKey);
          expect(res.status).toBe(401);
        });

        validApiKey = await settingsStore.generateSlicerApiKey();
      });
    });
  });
});
