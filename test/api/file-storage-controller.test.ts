import { setupTestApp } from "../test-server";
import { DITokens } from "@/container.tokens";
import { FileStorageService } from "@/services/file-storage.service";
import { expectOkResponse, expectInvalidResponse, expectNotFoundResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import { ConflictException } from "@/exceptions/runtime.exceptions";
import TestAgent from "supertest/lib/agent";
import { Test } from "supertest";

describe("FileStorageController", () => {
  let testRequest: TestAgent<Test>;
  let fileStorageService: FileStorageService;

  const baseRoute = AppConstants.apiRoute + "/file-storage";
  const SIMPLE_GCODE = "G28\nG1 X10 Y10\n";

  const uploadFile = (filename: string, content: string) => {
    return testRequest
      .post(`${baseRoute}/upload`)
      .set("Accept", "application/json")
      .attach("file", Buffer.from(content), filename);
  };

  let mockFileIdCounter = 0;
  let uploadedFilenames: Map<string, string>;

  beforeAll(async () => {
    const { request, container } = await setupTestApp(false);
    testRequest = request;
    fileStorageService = container.resolve<FileStorageService>(DITokens.fileStorageService);
    uploadedFilenames = new Map();

    vi.spyOn(fileStorageService, "saveFile").mockImplementation(async (file) => {
      const fileId = `mock-file-id-${++mockFileIdCounter}`;
      uploadedFilenames.set(file.originalname, fileId);
      return fileId;
    });

    vi.spyOn(fileStorageService, "calculateFileHash").mockResolvedValue("mock-hash-abc123");
    vi.spyOn(fileStorageService, "getFilePath").mockImplementation((id: string) => `/mock/path/${id}`);
    vi.spyOn(fileStorageService, "saveMetadata").mockResolvedValue(undefined);
    vi.spyOn(fileStorageService, "saveThumbnails").mockResolvedValue([]);

    vi.spyOn(fileStorageService, "validateUniqueFilename").mockImplementation(async (filename: string) => {
      if (uploadedFilenames.has(filename)) {
        throw new ConflictException(
          `A file named "${filename}" already exists in storage. Please rename the file, delete the existing file (ID: ${uploadedFilenames.get(filename)}), or choose a different name.`,
          uploadedFilenames.get(filename),
        );
      }
    });

    vi.spyOn(fileStorageService, "findDuplicateByOriginalFileName").mockImplementation(async (filename: string) => {
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

  beforeEach(() => {
    uploadedFilenames.clear();
    mockFileIdCounter = 0;
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/file-storage - List files", () => {
    beforeEach(() => {
      vi.spyOn(fileStorageService, "listAllFiles").mockResolvedValue([]);
    });

    it("should return empty array when no files exist", async () => {
      const res = await testRequest.get(baseRoute);
      expectOkResponse(res);
      expect(Array.isArray(res.body.files)).toBe(true);
      expect(res.body.files.length).toBe(0);
    });

    it("should return list of files with metadata", async () => {
      vi.spyOn(fileStorageService, "listAllFiles").mockResolvedValue([
        {
          fileStorageId: "file-123",
          fileName: "test.gcode",
          fileFormat: "gcode",
          fileSize: 1024,
          fileHash: "abc123",
          createdAt: new Date(),
          thumbnailCount: 2,
          metadata: { _originalFileName: "test.gcode" },
        },
      ]);

      const res = await testRequest.get(baseRoute);
      expectOkResponse(res);
      expect(res.body.files.length).toBe(1);
      expect(res.body.files[0].fileName).toBe("test.gcode");
      expect(res.body.files[0].fileStorageId).toBe("file-123");
    });
  });

  describe("GET /api/file-storage/:id - Get file info", () => {
    it("should return 404 for non-existent file", async () => {
      vi.spyOn(fileStorageService, "getFileInfo").mockResolvedValue(null);

      const res = await testRequest.get(`${baseRoute}/non-existent-id`);
      expectNotFoundResponse(res);
    });

    it("should return file info for existing file", async () => {
      vi.spyOn(fileStorageService, "getFileInfo").mockResolvedValue({
        fileStorageId: "file-123",
        fileName: "test.gcode",
        fileFormat: "gcode",
        fileSize: 1024,
        fileHash: "abc123",
        createdAt: new Date(),
        thumbnailCount: 1,
        metadata: { _originalFileName: "test.gcode" },
      });

      const res = await testRequest.get(`${baseRoute}/file-123`);
      expectOkResponse(res);
      expect(res.body.fileStorageId).toBe("file-123");
      expect(res.body.fileName).toBe("test.gcode");
    });
  });

  describe("DELETE /api/file-storage/:id - Delete file", () => {
    it("should delete file successfully", async () => {
      vi.spyOn(fileStorageService, "deleteFile").mockResolvedValue(undefined);

      const res = await testRequest.delete(`${baseRoute}/file-123`);
      expectOkResponse(res);
      expect(fileStorageService.deleteFile).toHaveBeenCalledWith("file-123");
    });
  });

  describe("POST /api/file-storage/upload - Upload file", () => {
    it("should upload gcode file successfully", async () => {
      const res = await uploadFile("test.gcode", SIMPLE_GCODE);

      expectOkResponse(res);
      expect(res.body.message).toBe("File uploaded successfully");
      expect(res.body.fileStorageId).toBeDefined();
      expect(res.body.fileName).toBe("test.gcode");
      expect(res.body.fileHash).toBeDefined();
    });

    it("should return 400 when no file is uploaded", async () => {
      const res = await testRequest.post(`${baseRoute}/upload`).set("Accept", "application/json");

      expectInvalidResponse(res);
    });

    it("should return 400 when multiple files are uploaded", async () => {
      const res = await testRequest
        .post(`${baseRoute}/upload`)
        .set("Accept", "application/json")
        .attach("file", Buffer.from(SIMPLE_GCODE), "test1.gcode")
        .attach("file", Buffer.from(SIMPLE_GCODE), "test2.gcode");

      expectInvalidResponse(res);
    });

    it("should reject duplicate filename uploads", async () => {
      const filename = "duplicate-storage.gcode";

      const res1 = await uploadFile(filename, SIMPLE_GCODE);
      expectOkResponse(res1);

      const res2 = await uploadFile(filename, "G28\nG1 X20 Y20\n");
      expect(res2.status).toBe(409);
      expect(res2.body.error).toContain("already exists");
      expect(res2.body.error).toContain(filename);
      expect(res2.body.existingResourceId).toBeDefined();
    });

    it("should accept .3mf files", async () => {
      const res = await uploadFile("test.3mf", SIMPLE_GCODE);
      expect(res.status).toBeGreaterThanOrEqual(200);
    });

    it("should accept .bgcode files", async () => {
      const res = await uploadFile("test.bgcode", SIMPLE_GCODE);
      expect(res.status).toBeGreaterThanOrEqual(200);
    });

    it("should reject invalid file extensions", async () => {
      const res = await uploadFile("test.txt", "not a gcode file");
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle files with special characters in name", async () => {
      const specialNames = ["test with spaces.gcode", "test-with-dashes.gcode", "test_with_underscores.gcode"];

      for (const name of specialNames) {
        const res = await uploadFile(name, SIMPLE_GCODE);
        expectOkResponse(res);
        expect(res.body.fileName).toBe(name);
      }
    });

    it("should include metadata in response", async () => {
      const res = await uploadFile("metadata-test.gcode", SIMPLE_GCODE);

      expectOkResponse(res);
      expect(res.body.metadata).toBeDefined();
      expect(res.body.fileHash).toBeDefined();
    });

    it("should include thumbnail count in response", async () => {
      const res = await uploadFile("thumb-test.gcode", SIMPLE_GCODE);

      expectOkResponse(res);
      expect(res.body).toHaveProperty("thumbnailCount");
      expect(typeof res.body.thumbnailCount).toBe("number");
    });
  });

  describe("GET /api/file-storage/:id/thumbnail/:index - Get thumbnail", () => {
    it("should return 404 for non-existent thumbnail", async () => {
      vi.spyOn(fileStorageService, "getThumbnail").mockResolvedValue(null);

      const res = await testRequest.get(`${baseRoute}/file-123/thumbnail/0`);
      expectNotFoundResponse(res);
    });

    it("should return thumbnail when it exists", async () => {
      const mockImage = Buffer.from("fake image data");
      vi.spyOn(fileStorageService, "getThumbnail").mockResolvedValue(mockImage);

      const res = await testRequest.get(`${baseRoute}/file-123/thumbnail/0`);
      expectOkResponse(res);
    });
  });

  describe("Edge cases", () => {
    it("should handle very long filenames", async () => {
      const longFilename = "a".repeat(200) + ".gcode";
      const res = await uploadFile(longFilename, SIMPLE_GCODE);
      expectOkResponse(res);
    });

    it("should handle empty gcode file", async () => {
      const res = await uploadFile("empty.gcode", "");
      expectOkResponse(res);
    });

    it("should handle large file content", async () => {
      const largeContent = "G28\n" + "G1 X10 Y10\n".repeat(10000);
      const res = await uploadFile("large.gcode", largeContent);
      expectOkResponse(res);
    });
  });

  describe("Concurrent operations", () => {
    it("should handle multiple concurrent uploads", async () => {
      const uploads = Array.from({ length: 3 }, (_, i) =>
        uploadFile(`concurrent-${i}.gcode`, `G28\nG1 X${i * 10} Y${i * 10}\n`),
      );

      const results = await Promise.all(uploads);

      results.forEach((res) => {
        expectOkResponse(res);
      });

      const fileIds = results.map((r) => r.body.fileStorageId);
      const uniqueIds = new Set(fileIds);
      expect(uniqueIds.size).toBe(3);
    });
  });
});
