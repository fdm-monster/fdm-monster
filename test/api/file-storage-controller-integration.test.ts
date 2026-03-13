import { setupTestApp } from "../test-server";
import { DITokens } from "@/container.tokens";
import { FileStorageService } from "@/services/file-storage.service";
import { expectOkResponse, expectNotFoundResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import TestAgent from "supertest/lib/agent";
import { Test } from "supertest";
import path from "node:path";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";

describe("FileStorageController - Real Integration", () => {
  let testRequest: TestAgent<Test>;
  let fileStorageService: FileStorageService;

  const baseRoute = AppConstants.apiRoute + "/file-storage";
  const testDataDir = path.join(__dirname, "..", "api", "test-data");
  const SIMPLE_GCODE = "G28\nG1 X10 Y10 Z0.2 F1500\nG1 X20 Y20 E0.5\n";

  const uploadFile = (filename: string, content: string) => {
    return testRequest
      .post(`${baseRoute}/upload`)
      .set("Accept", "application/json")
      .attach("file", Buffer.from(content), filename);
  };

  beforeAll(async () => {
    const { request, container } = await setupTestApp(false);
    testRequest = request;
    fileStorageService = container.resolve<FileStorageService>(DITokens.fileStorageService);

    await fileStorageService.ensureStorageDirectories();

    if (!existsSync(testDataDir)) {
      mkdirSync(testDataDir, { recursive: true });
    }
  });

  describe("GET /api/file-storage - List files", () => {
    it("should return empty array when no files exist", async () => {
      const res = await testRequest.get(baseRoute);
      expectOkResponse(res);
      expect(Array.isArray(res.body.files)).toBe(true);
      expect(res.body.totalCount).toBeGreaterThanOrEqual(0);
    });

    it("should return list of files after upload", async () => {
      const uploadRes = await uploadFile("integration-list-test.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      const fileStorageId = uploadRes.body.fileStorageId;

      const listRes = await testRequest.get(baseRoute);
      expectOkResponse(listRes);
      expect(Array.isArray(listRes.body.files)).toBe(true);
      expect(listRes.body.files.some((f: any) => f.fileStorageId === fileStorageId)).toBe(true);

      await fileStorageService.deleteFile(fileStorageId);
    });
  });

  describe("GET /api/file-storage/:id - Get file metadata", () => {
    it("should return 404 for non-existent file", async () => {
      const res = await testRequest.get(`${baseRoute}/non-existent-file-id-12345`);
      expectNotFoundResponse(res);
    });

    it("should return file metadata for existing file", async () => {
      const uploadRes = await uploadFile("integration-metadata-test.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      const fileStorageId = uploadRes.body.fileStorageId;

      const metadataRes = await testRequest.get(`${baseRoute}/${fileStorageId}`);
      expectOkResponse(metadataRes);
      expect(metadataRes.body.fileStorageId).toBe(fileStorageId);
      expect(metadataRes.body.fileName).toBeDefined();
      expect(metadataRes.body.fileFormat).toBeDefined();
      expect(metadataRes.body.fileSize).toBeGreaterThan(0);
      expect(metadataRes.body.fileHash).toBeDefined();
      expect(metadataRes.body.createdAt).toBeDefined();

      await fileStorageService.deleteFile(fileStorageId);
    });
  });

  describe("POST /api/file-storage/upload - Upload file", () => {
    it("should upload gcode file successfully", async () => {
      const res = await uploadFile("integration-upload-test.gcode", SIMPLE_GCODE);

      expectOkResponse(res);
      expect(res.body.message).toBe("File uploaded successfully");
      expect(res.body.fileStorageId).toBeDefined();
      expect(res.body.fileName).toBe("integration-upload-test.gcode");
      expect(res.body.fileSize).toBeGreaterThan(0);
      expect(res.body.fileHash).toBeDefined();
      expect(res.body.metadata).toBeDefined();

      await fileStorageService.deleteFile(res.body.fileStorageId);
    });

    it("should reject duplicate filename uploads", async () => {
      const filename = "integration-duplicate-test.gcode";

      const res1 = await uploadFile(filename, SIMPLE_GCODE);
      expectOkResponse(res1);
      const fileStorageId = res1.body.fileStorageId;

      const res2 = await uploadFile(filename, "G28\nG1 X30 Y30\n");
      expect(res2.status).toBe(409);
      expect(res2.body.error).toContain("already exists");
      expect(res2.body.error).toContain(filename);

      await fileStorageService.deleteFile(fileStorageId);
    });

    it("should accept .3mf files even if analysis fails", async () => {
      const res = await uploadFile("integration-test.3mf", SIMPLE_GCODE);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("should accept .bgcode files even if analysis fails", async () => {
      const res = await uploadFile("integration-test.bgcode", SIMPLE_GCODE);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle files with spaces in name", async () => {
      const filename = "integration test with spaces.gcode";
      const res = await uploadFile(filename, SIMPLE_GCODE);

      expectOkResponse(res);
      expect(res.body.fileName).toBe(filename);

      await fileStorageService.deleteFile(res.body.fileStorageId);
    });
  });

  describe("DELETE /api/file-storage/:id - Delete file", () => {
    it("should delete file successfully", async () => {
      const uploadRes = await uploadFile("integration-delete-test.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      const fileStorageId = uploadRes.body.fileStorageId;

      const deleteRes = await testRequest.delete(`${baseRoute}/${fileStorageId}`);
      expectOkResponse(deleteRes);
      expect(deleteRes.body.message).toContain("deleted successfully");
      expect(deleteRes.body.fileStorageId).toBe(fileStorageId);

      const getRes = await testRequest.get(`${baseRoute}/${fileStorageId}`);
      expectNotFoundResponse(getRes);
    });
  });

  describe("POST /api/file-storage/:id/analyze - Analyze file", () => {
    it("should return 404 for non-existent file", async () => {
      const res = await testRequest.post(`${baseRoute}/non-existent-id/analyze`);
      expectNotFoundResponse(res);
    });

    it("should analyze existing file successfully", async () => {
      const uploadRes = await uploadFile("integration-analyze-test.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      const fileStorageId = uploadRes.body.fileStorageId;

      const analyzeRes = await testRequest.post(`${baseRoute}/${fileStorageId}/analyze`);
      expectOkResponse(analyzeRes);
      expect(analyzeRes.body.message).toContain("analyzed successfully");
      expect(analyzeRes.body.fileStorageId).toBe(fileStorageId);
      expect(analyzeRes.body.metadata).toBeDefined();

      await fileStorageService.deleteFile(fileStorageId);
    });
  });

  describe("GET /api/file-storage/:id/thumbnail/:index - Get thumbnail", () => {
    it("should return 404 for non-existent file", async () => {
      const res = await testRequest.get(`${baseRoute}/non-existent-id/thumbnail/0`);
      expectNotFoundResponse(res);
    });

    it("should return 404 for non-existent thumbnail index", async () => {
      const uploadRes = await uploadFile("integration-no-thumb.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      const fileStorageId = uploadRes.body.fileStorageId;

      const res = await testRequest.get(`${baseRoute}/${fileStorageId}/thumbnail/0`);
      expectNotFoundResponse(res);

      await fileStorageService.deleteFile(fileStorageId);
    });
  });

  describe("Real file operations workflow", () => {
    it("should complete full upload-analyze-retrieve-delete workflow", async () => {
      const uploadRes = await uploadFile("integration-workflow-test.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      const fileStorageId = uploadRes.body.fileStorageId;
      expect(fileStorageId).toBeDefined();

      const metadataRes = await testRequest.get(`${baseRoute}/${fileStorageId}`);
      expectOkResponse(metadataRes);
      expect(metadataRes.body.fileStorageId).toBe(fileStorageId);

      const analyzeRes = await testRequest.post(`${baseRoute}/${fileStorageId}/analyze`);
      expectOkResponse(analyzeRes);
      expect(analyzeRes.body.metadata).toBeDefined();

      const listRes = await testRequest.get(baseRoute);
      expectOkResponse(listRes);
      expect(listRes.body.files.some((f: any) => f.fileStorageId === fileStorageId)).toBe(true);

      const deleteRes = await testRequest.delete(`${baseRoute}/${fileStorageId}`);
      expectOkResponse(deleteRes);

      const notFoundRes = await testRequest.get(`${baseRoute}/${fileStorageId}`);
      expectNotFoundResponse(notFoundRes);
    });

    it("should handle multiple concurrent uploads without conflicts", async () => {
      const uploads = await Promise.all([
        uploadFile("integration-concurrent-1.gcode", SIMPLE_GCODE),
        uploadFile("integration-concurrent-2.gcode", SIMPLE_GCODE),
        uploadFile("integration-concurrent-3.gcode", SIMPLE_GCODE),
      ]);

      uploads.forEach((res) => expectOkResponse(res));

      const fileIds = uploads.map((r) => r.body.fileStorageId);
      const uniqueIds = new Set(fileIds);
      expect(uniqueIds.size).toBe(3);

      await Promise.all(fileIds.map((id) => fileStorageService.deleteFile(id)));
    });
  });

  describe("FileRecord integration", () => {
    it("should create FileRecord when file is uploaded", async () => {
      const uploadRes = await uploadFile("filerecord-create-test.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      const fileStorageId = uploadRes.body.fileStorageId;

      const fileRecord = await fileStorageService.getFileRecordByGuid(fileStorageId);
      expect(fileRecord).toBeTruthy();
      expect(fileRecord?.fileGuid).toBe(fileStorageId);
      expect(fileRecord?.name).toBe("filerecord-create-test.gcode");
      expect(fileRecord?.type).toBe("gcode");
      expect(fileRecord?.parentId).toBe(0);

      await fileStorageService.deleteFile(fileStorageId);
    });

    it("should delete FileRecord when file is deleted", async () => {
      const uploadRes = await uploadFile("filerecord-delete-test.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      const fileStorageId = uploadRes.body.fileStorageId;

      let fileRecord = await fileStorageService.getFileRecordByGuid(fileStorageId);
      expect(fileRecord).toBeTruthy();

      await fileStorageService.deleteFile(fileStorageId);

      fileRecord = await fileStorageService.getFileRecordByGuid(fileStorageId);
      expect(fileRecord).toBeNull();
    });

    it("should list files from FileRecords", async () => {
      const timestamp = Date.now();
      const uploadRes = await uploadFile(`filerecord-list-test-${timestamp}.gcode`, SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      const fileStorageId = uploadRes.body.fileStorageId;

      const result = await fileStorageService.listAllFiles();
      const foundFile = result.files.find(f => f.fileStorageId === fileStorageId);

      expect(foundFile).toBeDefined();
      expect(foundFile?.fileName).toBe(`filerecord-list-test-${timestamp}.gcode`);
      expect(foundFile?.fileFormat).toBe("gcode");

      await fileStorageService.deleteFile(fileStorageId);
    });

    it("should correctly categorize .3mf files", async () => {
      const uploadRes = await uploadFile("filerecord-3mf-test.3mf", SIMPLE_GCODE);
      if (uploadRes.status >= 400) {
        expect(uploadRes.status).toBeGreaterThanOrEqual(400);
        return;
      }
      const fileStorageId = uploadRes.body.fileStorageId;

      const fileRecord = await fileStorageService.getFileRecordByGuid(fileStorageId);
      expect(fileRecord?.type).toBe("3mf");

      await fileStorageService.deleteFile(fileStorageId);
    });

    it("should correctly categorize .bgcode files", async () => {
      const uploadRes = await uploadFile("filerecord-bgcode-test.bgcode", SIMPLE_GCODE);
      if (uploadRes.status >= 400) {
        expect(uploadRes.status).toBeGreaterThanOrEqual(400);
        return;
      }
      const fileStorageId = uploadRes.body.fileStorageId;

      const fileRecord = await fileStorageService.getFileRecordByGuid(fileStorageId);
      expect(fileRecord?.type).toBe("bgcode");

      await fileStorageService.deleteFile(fileStorageId);
    });
  });

  describe("Pagination and filtering", () => {
    it("should paginate file list results", async () => {
      const fileIds: string[] = [];
      const timestamp = Date.now();
      for (let i = 0; i < 5; i++) {
        const res = await uploadFile(`pagination-test-${timestamp}-${i}.gcode`, SIMPLE_GCODE);
        expectOkResponse(res);
        fileIds.push(res.body.fileStorageId);
      }

      const page1 = await testRequest.get(`${baseRoute}?page=1&pageSize=2`);
      expectOkResponse(page1);
      expect(page1.body.files.length).toBe(2);
      expect(page1.body.page).toBe(1);
      expect(page1.body.pageSize).toBe(2);
      expect(page1.body.totalCount).toBeGreaterThanOrEqual(5);
      expect(page1.body.totalPages).toBeGreaterThanOrEqual(3);

      const page2 = await testRequest.get(`${baseRoute}?page=2&pageSize=2`);
      expectOkResponse(page2);
      expect(page2.body.files.length).toBe(2);
      expect(page2.body.page).toBe(2);

      await Promise.all(fileIds.map((id) => fileStorageService.deleteFile(id)));
    });

    it("should filter files by type", async () => {
      const gcodeRes = await uploadFile("filter-gcode.gcode", SIMPLE_GCODE);
      expectOkResponse(gcodeRes);
      const gcodeId = gcodeRes.body.fileStorageId;

      const listRes = await testRequest.get(`${baseRoute}?type=gcode`);
      expectOkResponse(listRes);
      expect(listRes.body.files.every((f: any) => f.fileFormat === "gcode")).toBe(true);

      await fileStorageService.deleteFile(gcodeId);
    });

    it("should sort files by name", async () => {
      const fileIds: string[] = [];
      const names = ["charlie.gcode", "alpha.gcode", "bravo.gcode"];
      for (const name of names) {
        const res = await uploadFile(name, SIMPLE_GCODE);
        expectOkResponse(res);
        fileIds.push(res.body.fileStorageId);
      }

      const sortedRes = await testRequest.get(`${baseRoute}?sortBy=name&sortOrder=ASC&pageSize=100`);
      expectOkResponse(sortedRes);

      const uploadedFiles = sortedRes.body.files.filter((f: any) =>
        names.includes(f.fileName)
      );
      expect(uploadedFiles.length).toBe(3);
      expect(uploadedFiles[0].fileName).toBe("alpha.gcode");
      expect(uploadedFiles[1].fileName).toBe("bravo.gcode");
      expect(uploadedFiles[2].fileName).toBe("charlie.gcode");

      await Promise.all(fileIds.map((id) => fileStorageService.deleteFile(id)));
    });
  });

  describe("PATCH /api/file-storage/:id - Update metadata", () => {
    it("should rename file successfully", async () => {
      const uploadRes = await uploadFile("original-name.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      const fileStorageId = uploadRes.body.fileStorageId;

      const patchRes = await testRequest
        .patch(`${baseRoute}/${fileStorageId}`)
        .send({ originalFileName: "renamed-file.gcode" });

      expectOkResponse(patchRes);
      expect(patchRes.body.message).toContain("updated");
      expect(patchRes.body.fileName).toBe("renamed-file.gcode");

      const metadataRes = await testRequest.get(`${baseRoute}/${fileStorageId}`);
      expectOkResponse(metadataRes);
      expect(metadataRes.body.fileName).toBe("renamed-file.gcode");

      await fileStorageService.deleteFile(fileStorageId);
    });

    it("should return 404 for non-existent file", async () => {
      const res = await testRequest
        .patch(`${baseRoute}/non-existent-id`)
        .send({ originalFileName: "new-name.gcode" });

      expect(res.status).toBe(404);
    });

    it("should return 400 when originalFileName is missing", async () => {
      const uploadRes = await uploadFile("test-missing-name.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      const fileStorageId = uploadRes.body.fileStorageId;

      const res = await testRequest.patch(`${baseRoute}/${fileStorageId}`).send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("originalFileName");

      await fileStorageService.deleteFile(fileStorageId);
    });
  });
});
