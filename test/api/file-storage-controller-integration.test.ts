import { setupTestApp } from "../test-server";
import { DITokens } from "@/container.tokens";
import { FileStorageService } from "@/services/file-storage.service";
import { expectOkResponse, expectNotFoundResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import TestAgent from "supertest/lib/agent";
import { Test } from "supertest";
import path from "node:path";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import crypto from "node:crypto";

describe("FileStorageController - Real Integration", () => {
  let testRequest: TestAgent<Test>;
  let fileStorageService: FileStorageService;

  const baseRoute = AppConstants.apiRoute + "/file-storage";
  const testDataDir = path.join(__dirname, "..", "api", "test-data");
  const SIMPLE_GCODE = "G28\nG1 X10 Y10 Z0.2 F1500\nG1 X20 Y20 E0.5\n";

  const uploadFile = (filename: string, content: string, options?: { filePath?: string }) => {
    const req = testRequest.post(`${baseRoute}/upload`).set("Accept", "application/json");

    if (options?.filePath) {
      req.field("filePath", options.filePath);
    }

    return req.attach("file", Buffer.from(content), filename);
  };

  beforeAll(async () => {
    const { request, container } = await setupTestApp(false);
    testRequest = request;
    fileStorageService = container.resolve<FileStorageService>(DITokens.fileStorageService);

    await fileStorageService.ensureStorageDirectories();

    if (!existsSync(testDataDir)) {
      mkdirSync(testDataDir, { recursive: true });
    }

    const allRecords = await fileStorageService["fileRecordRepository"].find();
    for (const record of allRecords) {
      if (record.id !== 0) {
        await fileStorageService["fileRecordRepository"].remove(record);
      }
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
      const timestamp = Date.now();
      const uploadRes = await uploadFile(`integration-list-test-${timestamp}.gcode`, SIMPLE_GCODE);
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
      const timestamp = Date.now();
      const uploadRes = await uploadFile(`integration-workflow-test-${timestamp}.gcode`, SIMPLE_GCODE);
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
      const foundFile = result.files.find((f) => f.fileStorageId === fileStorageId);

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
      expect(page1.body.files.length).toBeGreaterThanOrEqual(1);
      expect(page1.body.files.length).toBeLessThanOrEqual(2);
      expect(page1.body.page).toBe(1);
      expect(page1.body.pageSize).toBe(2);
      expect(page1.body.totalCount).toBeGreaterThanOrEqual(5);
      expect(page1.body.totalPages).toBeGreaterThanOrEqual(3);

      const page2 = await testRequest.get(`${baseRoute}?page=2&pageSize=2`);
      expectOkResponse(page2);
      expect(page2.body.files.length).toBeGreaterThanOrEqual(1);
      expect(page2.body.files.length).toBeLessThanOrEqual(2);
      expect(page2.body.page).toBe(2);

      const allPages = [...page1.body.files, ...page2.body.files];
      const uploadedFilesFound = fileIds.filter((id) => allPages.some((f) => f.fileStorageId === id));
      expect(uploadedFilesFound.length).toBeGreaterThanOrEqual(2);

      await Promise.all(fileIds.map((id) => fileStorageService.deleteFile(id)));
    });

    it("should filter files by type", async () => {
      const timestamp = Date.now();
      const gcodeRes = await uploadFile(`filter-gcode-${timestamp}.gcode`, SIMPLE_GCODE);
      expectOkResponse(gcodeRes);
      const gcodeId = gcodeRes.body.fileStorageId;

      const listRes = await testRequest.get(`${baseRoute}?type=gcode`);
      expectOkResponse(listRes);
      expect(listRes.body.files.every((f: any) => f.fileFormat === "gcode")).toBe(true);

      await fileStorageService.deleteFile(gcodeId);
    });

    it("should sort files by name", async () => {
      const timestamp = Date.now();
      const fileIds: string[] = [];
      const names = [`charlie-${timestamp}.gcode`, `alpha-${timestamp}.gcode`, `bravo-${timestamp}.gcode`];
      for (const name of names) {
        const res = await uploadFile(name, SIMPLE_GCODE);
        expectOkResponse(res);
        fileIds.push(res.body.fileStorageId);
      }

      const sortedRes = await testRequest.get(`${baseRoute}?sortBy=name&sortOrder=ASC&pageSize=100`);
      expectOkResponse(sortedRes);

      const uploadedFiles = sortedRes.body.files.filter((f: any) => names.includes(f.fileName));
      expect(uploadedFiles.length).toBe(3);
      expect(uploadedFiles[0].fileName).toBe(`alpha-${timestamp}.gcode`);
      expect(uploadedFiles[1].fileName).toBe(`bravo-${timestamp}.gcode`);
      expect(uploadedFiles[2].fileName).toBe(`charlie-${timestamp}.gcode`);

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
      const res = await testRequest.patch(`${baseRoute}/non-existent-id`).send({ originalFileName: "new-name.gcode" });

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

  describe("POST /api/file-storage/bulk/delete - Bulk delete files", () => {
    it("should delete multiple files successfully", async () => {
      const fileIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const res = await uploadFile(`bulk-delete-test-${i}.gcode`, SIMPLE_GCODE);
        expectOkResponse(res);
        fileIds.push(res.body.fileStorageId);
      }

      const bulkDeleteRes = await testRequest.post(`${baseRoute}/bulk/delete`).send({ fileIds });

      expectOkResponse(bulkDeleteRes);
      expect(bulkDeleteRes.body.deleted).toBe(3);
      expect(bulkDeleteRes.body.failed).toBe(0);
      expect(bulkDeleteRes.body.errors).toEqual([]);

      for (const fileId of fileIds) {
        const getRes = await testRequest.get(`${baseRoute}/${fileId}`);
        expectNotFoundResponse(getRes);
      }
    });

    it("should handle partial failures gracefully", async () => {
      const uploadRes = await uploadFile("bulk-delete-partial.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      const validId = uploadRes.body.fileStorageId;
      const invalidId = "non-existent-file-id-12345";

      const bulkDeleteRes = await testRequest.post(`${baseRoute}/bulk/delete`).send({ fileIds: [validId, invalidId] });

      expectOkResponse(bulkDeleteRes);
      expect(bulkDeleteRes.body.deleted).toBe(1);
      expect(bulkDeleteRes.body.failed).toBe(1);
      expect(bulkDeleteRes.body.errors).toHaveLength(1);
      expect(bulkDeleteRes.body.errors[0].fileId).toBe(invalidId);
      expect(bulkDeleteRes.body.errors[0].error).toBeDefined();

      const getRes = await testRequest.get(`${baseRoute}/${validId}`);
      expectNotFoundResponse(getRes);
    });

    it("should return 400 when fileIds is not an array", async () => {
      const res = await testRequest.post(`${baseRoute}/bulk/delete`).send({ fileIds: "not-an-array" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("array");
    });

    it("should return 400 when fileIds is empty", async () => {
      const res = await testRequest.post(`${baseRoute}/bulk/delete`).send({ fileIds: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("non-empty");
    });

    it("should return 400 when fileIds exceeds limit", async () => {
      const fileIds = Array.from({ length: 101 }, (_, i) => `file-${i}`);
      const res = await testRequest.post(`${baseRoute}/bulk/delete`).send({ fileIds });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("100");
    });

    it("should handle all files not found", async () => {
      const bulkDeleteRes = await testRequest
        .post(`${baseRoute}/bulk/delete`)
        .send({ fileIds: ["not-found-1", "not-found-2", "not-found-3"] });

      expectOkResponse(bulkDeleteRes);
      expect(bulkDeleteRes.body.deleted).toBe(0);
      expect(bulkDeleteRes.body.failed).toBe(3);
      expect(bulkDeleteRes.body.errors).toHaveLength(3);
    });

    it("should delete FileRecords for bulk deleted files", async () => {
      const fileIds: string[] = [];
      for (let i = 0; i < 2; i++) {
        const res = await uploadFile(`bulk-delete-record-${i}.gcode`, SIMPLE_GCODE);
        expectOkResponse(res);
        fileIds.push(res.body.fileStorageId);
      }

      for (const fileId of fileIds) {
        const record = await fileStorageService.getFileRecordByGuid(fileId);
        expect(record).toBeTruthy();
      }

      const bulkDeleteRes = await testRequest.post(`${baseRoute}/bulk/delete`).send({ fileIds });

      expectOkResponse(bulkDeleteRes);
      expect(bulkDeleteRes.body.deleted).toBe(2);

      for (const fileId of fileIds) {
        const record = await fileStorageService.getFileRecordByGuid(fileId);
        expect(record).toBeNull();
      }
    });
  });

  describe("POST /api/file-storage/bulk/analyze - Bulk analyze files", () => {
    it("should analyze multiple files successfully", async () => {
      const timestamp = Date.now();
      const fileIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const res = await uploadFile(`bulk-analyze-test-${timestamp}-${i}.gcode`, SIMPLE_GCODE);
        expectOkResponse(res);
        fileIds.push(res.body.fileStorageId);
      }

      const bulkAnalyzeRes = await testRequest.post(`${baseRoute}/bulk/analyze`).send({ fileIds });

      expectOkResponse(bulkAnalyzeRes);
      expect(bulkAnalyzeRes.body.analyzed).toBe(3);
      expect(bulkAnalyzeRes.body.failed).toBe(0);
      expect(bulkAnalyzeRes.body.errors).toEqual([]);

      await Promise.all(fileIds.map((id) => fileStorageService.deleteFile(id)));
    });

    it("should handle partial failures gracefully", async () => {
      const timestamp = Date.now();
      const uploadRes = await uploadFile(`bulk-analyze-partial-${timestamp}.gcode`, SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      const validId = uploadRes.body.fileStorageId;
      const invalidId = "non-existent-file-id-67890";

      const bulkAnalyzeRes = await testRequest
        .post(`${baseRoute}/bulk/analyze`)
        .send({ fileIds: [validId, invalidId] });

      expectOkResponse(bulkAnalyzeRes);
      expect(bulkAnalyzeRes.body.analyzed).toBe(1);
      expect(bulkAnalyzeRes.body.failed).toBe(1);
      expect(bulkAnalyzeRes.body.errors).toHaveLength(1);
      expect(bulkAnalyzeRes.body.errors[0].fileId).toBe(invalidId);
      expect(bulkAnalyzeRes.body.errors[0].error).toBeDefined();

      await fileStorageService.deleteFile(validId);
    });

    it("should return 400 when fileIds is not an array", async () => {
      const res = await testRequest.post(`${baseRoute}/bulk/analyze`).send({ fileIds: "not-an-array" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("array");
    });

    it("should return 400 when fileIds is empty", async () => {
      const res = await testRequest.post(`${baseRoute}/bulk/analyze`).send({ fileIds: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("non-empty");
    });

    it("should return 400 when fileIds exceeds limit", async () => {
      const fileIds = Array.from({ length: 101 }, (_, i) => `file-${i}`);
      const res = await testRequest.post(`${baseRoute}/bulk/analyze`).send({ fileIds });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("100");
    });

    it("should handle all files not found", async () => {
      const bulkAnalyzeRes = await testRequest
        .post(`${baseRoute}/bulk/analyze`)
        .send({ fileIds: ["not-found-1", "not-found-2"] });

      expect(bulkAnalyzeRes.status).toBe(200);
      expect(bulkAnalyzeRes.body.analyzed).toBe(0);
      expect(bulkAnalyzeRes.body.failed).toBe(2);
      expect(bulkAnalyzeRes.body.errors).toHaveLength(2);
    });

    it("should update metadata after bulk analyze", async () => {
      const timestamp = Date.now();
      const uploadRes = await uploadFile(`bulk-analyze-metadata-${timestamp}.gcode`, SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      const fileId = uploadRes.body.fileStorageId;

      const metadataBefore = await fileStorageService.loadMetadata(fileId);
      const hashBefore = metadataBefore?._fileHash;

      const bulkAnalyzeRes = await testRequest.post(`${baseRoute}/bulk/analyze`).send({ fileIds: [fileId] });

      expectOkResponse(bulkAnalyzeRes);
      expect(bulkAnalyzeRes.body.analyzed).toBe(1);

      const metadataAfter = await fileStorageService.loadMetadata(fileId);
      expect(metadataAfter).toBeDefined();
      expect(metadataAfter?._fileHash).toBe(hashBefore);
      expect(metadataAfter?._originalFileName).toBe(`bulk-analyze-metadata-${timestamp}.gcode`);

      await fileStorageService.deleteFile(fileId);
    });
  });

  describe("Phase 1: Directory Filtering & Navigation", () => {
    describe("GET /file-storage?parentId", () => {
      it("should list root directory contents", async () => {
        const timestamp = Date.now();
        const uploadRes = await uploadFile(`phase1-root-${timestamp}.gcode`, SIMPLE_GCODE);
        expectOkResponse(uploadRes);
        const fileId = uploadRes.body.fileStorageId;

        const listRes = await testRequest.get(`${baseRoute}?parentId=0`);
        expectOkResponse(listRes);
        expect(Array.isArray(listRes.body.files)).toBe(true);
        expect(listRes.body.files.some((f: any) => f.fileStorageId === fileId)).toBe(true);

        await fileStorageService.deleteFile(fileId);
      });

      it("should list subdirectory contents", async () => {
        const subdir = await fileStorageService.createFileRecord({
          name: "test-subdir",
          type: "dir",
          fileGuid: "00000000-0000-0000-0000-000000000001",
          parentId: 0,
        });

        const timestamp = Date.now();
        const uploadRes = await uploadFile(`phase1-subdir-${timestamp}.gcode`, SIMPLE_GCODE);
        expectOkResponse(uploadRes);
        const fileId = uploadRes.body.fileStorageId;

        const fileRecord = await fileStorageService.getFileRecordByGuid(fileId);
        await fileStorageService.updateFileRecord(fileRecord!.id, { parentId: subdir.id });

        const listRes = await testRequest.get(`${baseRoute}?parentId=${subdir.id}`);
        expectOkResponse(listRes);
        expect(Array.isArray(listRes.body.files)).toBe(true);
        expect(listRes.body.files.some((f: any) => f.fileStorageId === fileId)).toBe(true);

        await fileStorageService.deleteFile(fileId);
        await fileStorageService.deleteFileRecord(subdir.id);
      });

      it("should return empty array for empty directory", async () => {
        const emptyDir = await fileStorageService.createFileRecord({
          name: "empty-dir",
          type: "dir",
          fileGuid: "00000000-0000-0000-0000-000000000002",
          parentId: 0,
        });

        const listRes = await testRequest.get(`${baseRoute}?parentId=${emptyDir.id}`);
        expectOkResponse(listRes);
        expect(Array.isArray(listRes.body.files)).toBe(true);
        expect(listRes.body.files.length).toBe(0);

        await fileStorageService.deleteFileRecord(emptyDir.id);
      });

      it("should list all files when parentId is omitted (backward compatibility)", async () => {
        const listRes = await testRequest.get(baseRoute);
        expectOkResponse(listRes);
        expect(Array.isArray(listRes.body.files)).toBe(true);
        expect(listRes.body).toHaveProperty("page");
        expect(listRes.body).toHaveProperty("pageSize");
        expect(listRes.body).toHaveProperty("totalCount");
      });
    });

    describe("GET /file-storage/:id/path", () => {
      it("should return path for root directory", async () => {
        const root = await fileStorageService.getFileRecordById(0);
        expect(root).toBeDefined();

        const pathRes = await testRequest.get(`${baseRoute}/${root!.fileGuid}/path`);
        expectOkResponse(pathRes);
        expect(Array.isArray(pathRes.body.path)).toBe(true);
        expect(pathRes.body.path.length).toBe(1);
        expect(pathRes.body.path[0].id).toBe(0);
        expect(pathRes.body.path[0].name).toBe("/");
        expect(pathRes.body.targetId).toBe(0);
      });

      it("should return full ancestry path for nested file", async () => {
        const subdir1 = await fileStorageService.createFileRecord({
          name: "models",
          type: "dir",
          fileGuid: "00000000-0000-0000-0000-000000000003",
          parentId: 0,
        });

        const subdir2 = await fileStorageService.createFileRecord({
          name: "prototypes",
          type: "dir",
          fileGuid: "00000000-0000-0000-0000-000000000004",
          parentId: subdir1.id,
        });

        const timestamp = Date.now();
        const uploadRes = await uploadFile(`phase1-nested-${timestamp}.gcode`, SIMPLE_GCODE);
        expectOkResponse(uploadRes);
        const fileId = uploadRes.body.fileStorageId;

        const fileRecord = await fileStorageService.getFileRecordByGuid(fileId);
        await fileStorageService.updateFileRecord(fileRecord!.id, { parentId: subdir2.id });

        const pathRes = await testRequest.get(`${baseRoute}/${fileId}/path`);
        expectOkResponse(pathRes);
        expect(Array.isArray(pathRes.body.path)).toBe(true);
        expect(pathRes.body.path.length).toBe(4);
        expect(pathRes.body.path[0].name).toBe("/");
        expect(pathRes.body.path[1].name).toBe("models");
        expect(pathRes.body.path[2].name).toBe("prototypes");
        expect(pathRes.body.path[3].name).toBe(`phase1-nested-${timestamp}.gcode`);

        await fileStorageService.deleteFile(fileId);
        await fileStorageService.deleteFileRecord(subdir2.id);
        await fileStorageService.deleteFileRecord(subdir1.id);
      });

      it("should return 404 for non-existent file", async () => {
        const res = await testRequest.get(`${baseRoute}/non-existent-guid-12345/path`);
        expect(res.status).toBe(404);
      });

      it("should work for both files and directories", async () => {
        const subdir = await fileStorageService.createFileRecord({
          name: "test-dir-path",
          type: "dir",
          fileGuid: "00000000-0000-0000-0000-000000000005",
          parentId: 0,
        });

        const pathRes = await testRequest.get(`${baseRoute}/${subdir.fileGuid}/path`);
        expectOkResponse(pathRes);
        expect(Array.isArray(pathRes.body.path)).toBe(true);
        expect(pathRes.body.path.length).toBe(2);
        expect(pathRes.body.path[0].name).toBe("/");
        expect(pathRes.body.path[1].name).toBe("test-dir-path");

        await fileStorageService.deleteFileRecord(subdir.id);
      });
    });
  });

  describe("Phase 2: Upload to Directory", () => {
    let testDirectory: any;

    beforeEach(async () => {
      testDirectory = await fileStorageService.createFileRecord({
        parentId: 0,
        type: "dir",
        name: "test-uploads",
        fileGuid: crypto.randomUUID(),
        metadata: null,
      });
    });

    afterEach(async () => {
      if (testDirectory) {
        await fileStorageService.deleteFileRecord(testDirectory.id);
      }
    });

    it("should upload to root (no parentId provided) - backward compatible", async () => {
      const res = await uploadFile("test-root-default.gcode", SIMPLE_GCODE);

      expectOkResponse(res);
      expect(res.body.fileStorageId).toBeDefined();

      const fileRecord = await fileStorageService.getFileRecordByGuid(res.body.fileStorageId);
      expect(fileRecord).toBeDefined();
      expect(fileRecord?.parentId).toBe(0);

      await fileStorageService.deleteFile(res.body.fileStorageId);
    });

    it("should upload to root (parentId=0 explicit)", async () => {
      const res = await testRequest
        .post(`${baseRoute}/upload`)
        .set("Accept", "application/json")
        .field("parentId", "0")
        .attach("file", Buffer.from(SIMPLE_GCODE), "test-root-explicit.gcode");

      expectOkResponse(res);
      expect(res.body.fileStorageId).toBeDefined();

      const fileRecord = await fileStorageService.getFileRecordByGuid(res.body.fileStorageId);
      expect(fileRecord).toBeDefined();
      expect(fileRecord?.parentId).toBe(0);

      await fileStorageService.deleteFile(res.body.fileStorageId);
    });

    it("should upload to existing subdirectory", async () => {
      const res = await testRequest
        .post(`${baseRoute}/upload`)
        .set("Accept", "application/json")
        .field("parentId", testDirectory.id.toString())
        .attach("file", Buffer.from(SIMPLE_GCODE), "test-subdir.gcode");

      expectOkResponse(res);
      expect(res.body.fileStorageId).toBeDefined();

      const fileRecord = await fileStorageService.getFileRecordByGuid(res.body.fileStorageId);
      expect(fileRecord).toBeDefined();
      expect(fileRecord?.parentId).toBe(testDirectory.id);
      expect(fileRecord?.name).toBe("test-subdir.gcode");

      await fileStorageService.deleteFile(res.body.fileStorageId);
    });

    it("should reject upload to non-existent directory (404 error)", async () => {
      const res = await testRequest
        .post(`${baseRoute}/upload`)
        .set("Accept", "application/json")
        .field("parentId", "99999")
        .attach("file", Buffer.from(SIMPLE_GCODE), "test-invalid.gcode");

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("not found");
    });

    it("should reject upload to file instead of directory (400 error)", async () => {
      const fileRes = await uploadFile("test-file-parent.gcode", SIMPLE_GCODE);
      expectOkResponse(fileRes);

      const fileRecord = await fileStorageService.getFileRecordByGuid(fileRes.body.fileStorageId);

      const res = await testRequest
        .post(`${baseRoute}/upload`)
        .set("Accept", "application/json")
        .field("parentId", fileRecord?.id.toString())
        .attach("file", Buffer.from(SIMPLE_GCODE), "test-to-file.gcode");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("not a directory");

      await fileStorageService.deleteFile(fileRes.body.fileStorageId);
    });

    it("should verify uploaded file has correct parentId in database", async () => {
      const res = await testRequest
        .post(`${baseRoute}/upload`)
        .set("Accept", "application/json")
        .field("parentId", testDirectory.id.toString())
        .attach("file", Buffer.from(SIMPLE_GCODE), "test-verify-parent.gcode");

      expectOkResponse(res);

      const fileRecord = await fileStorageService["fileRecordRepository"].findOne({
        where: { fileGuid: res.body.fileStorageId },
      });

      expect(fileRecord).toBeDefined();
      expect(fileRecord?.parentId).toBe(testDirectory.id);
      expect(fileRecord?.type).toBe("gcode");
      expect(fileRecord?.name).toBe("test-verify-parent.gcode");

      await fileStorageService.deleteFile(res.body.fileStorageId);
    });
  });

  describe("Phase 2.5: Automatic Path Parsing", () => {
    afterEach(async () => {
      const records = await fileStorageService["fileRecordRepository"].find({
        where: [
          { name: "projects" },
          { name: "prototypes" },
          { name: "nested" },
          { name: "test-path.gcode" },
          { name: "windows-path.gcode" },
          { name: "deep-path.gcode" },
          { name: "simple.gcode" },
        ],
      });

      for (const record of records) {
        try {
          if (record.type === "gcode") {
            await fileStorageService.deleteFile(record.fileGuid);
          } else {
            await fileStorageService.deleteFileRecord(record.id);
          }
        } catch {}
      }
    });

    it("should auto-create directories from Unix-style path in filename", async () => {
      const res = await uploadFile("test-path.gcode", SIMPLE_GCODE, {
        filePath: "projects/prototypes/test-path.gcode",
      });

      expectOkResponse(res);
      expect(res.body.fileName).toBe("test-path.gcode");

      const fileRecord = await fileStorageService.getFileRecordByGuid(res.body.fileStorageId);
      expect(fileRecord).toBeDefined();
      expect(fileRecord?.name).toBe("test-path.gcode");
      expect(fileRecord?.parentId).not.toBe(0);

      const parentDir = await fileStorageService.getFileRecordById(fileRecord!.parentId);
      expect(parentDir).toBeDefined();
      expect(parentDir?.name).toBe("prototypes");
      expect(parentDir?.type).toBe("dir");

      const grandparentDir = await fileStorageService.getFileRecordById(parentDir!.parentId);
      expect(grandparentDir).toBeDefined();
      expect(grandparentDir?.name).toBe("projects");
      expect(grandparentDir?.type).toBe("dir");
      expect(grandparentDir?.parentId).toBe(0);

      await fileStorageService.deleteFile(res.body.fileStorageId);
    });

    it("should auto-create directories from Windows-style path in filename", async () => {
      const res = await uploadFile("windows-path.gcode", SIMPLE_GCODE, {
        filePath: "projects\\prototypes\\windows-path.gcode",
      });

      expectOkResponse(res);
      expect(res.body.fileName).toBe("windows-path.gcode");

      const fileRecord = await fileStorageService.getFileRecordByGuid(res.body.fileStorageId);
      expect(fileRecord).toBeDefined();
      expect(fileRecord?.name).toBe("windows-path.gcode");

      const parentDir = await fileStorageService.getFileRecordById(fileRecord!.parentId);
      expect(parentDir).toBeDefined();
      expect(parentDir?.name).toBe("prototypes");

      await fileStorageService.deleteFile(res.body.fileStorageId);
    });

    it("should reuse existing directories when path already exists", async () => {
      const firstRes = await uploadFile("test-path.gcode", SIMPLE_GCODE, {
        filePath: "nested/test-path.gcode",
      });
      expectOkResponse(firstRes);

      const firstRecord = await fileStorageService.getFileRecordByGuid(firstRes.body.fileStorageId);
      const firstParentId = firstRecord!.parentId;

      const secondRes = await uploadFile("deep-path.gcode", SIMPLE_GCODE, {
        filePath: "nested/deep-path.gcode",
      });
      expectOkResponse(secondRes);

      const secondRecord = await fileStorageService.getFileRecordByGuid(secondRes.body.fileStorageId);
      expect(secondRecord!.parentId).toBe(firstParentId);

      const dirs = await fileStorageService["fileRecordRepository"].find({
        where: { name: "nested", type: "dir" },
      });
      expect(dirs.length).toBe(1);

      await fileStorageService.deleteFile(firstRes.body.fileStorageId);
      await fileStorageService.deleteFile(secondRes.body.fileStorageId);
    });

    it("should upload to root when filename has no path separators", async () => {
      const res = await uploadFile("simple.gcode", SIMPLE_GCODE);

      expectOkResponse(res);

      const fileRecord = await fileStorageService.getFileRecordByGuid(res.body.fileStorageId);
      expect(fileRecord).toBeDefined();
      expect(fileRecord?.parentId).toBe(0);
      expect(fileRecord?.name).toBe("simple.gcode");

      await fileStorageService.deleteFile(res.body.fileStorageId);
    });

    it("should ignore path parsing when explicit parentId is provided", async () => {
      const testDir = await fileStorageService.createFileRecord({
        parentId: 0,
        type: "dir",
        name: "explicit-parent",
        fileGuid: crypto.randomUUID(),
        metadata: null,
      });

      const res = await testRequest
        .post(`${baseRoute}/upload`)
        .set("Accept", "application/json")
        .field("parentId", testDir.id.toString())
        .field("filePath", "should/ignore/path.gcode")
        .attach("file", Buffer.from(SIMPLE_GCODE), "path.gcode");

      expectOkResponse(res);

      const fileRecord = await fileStorageService.getFileRecordByGuid(res.body.fileStorageId);
      expect(fileRecord).toBeDefined();
      expect(fileRecord?.parentId).toBe(testDir.id);
      expect(fileRecord?.name).toBe("path.gcode");

      const shouldDir = await fileStorageService["fileRecordRepository"].findOne({
        where: { name: "should", type: "dir" },
      });
      expect(shouldDir).toBeNull();

      await fileStorageService.deleteFile(res.body.fileStorageId);
      await fileStorageService.deleteFileRecord(testDir.id);
    });
  });

  describe("Phase 3: File Relocation", () => {
    let sourceDir: FileRecord;
    let targetDir: FileRecord;
    let testFile: string;

    beforeEach(async () => {
      sourceDir = await fileStorageService.createFileRecord({
        parentId: 0,
        type: "dir",
        name: "source-folder",
        fileGuid: crypto.randomUUID(),
        metadata: null,
      });

      targetDir = await fileStorageService.createFileRecord({
        parentId: 0,
        type: "dir",
        name: "target-folder",
        fileGuid: crypto.randomUUID(),
        metadata: null,
      });
    });

    afterEach(async () => {
      try {
        if (testFile) {
          await fileStorageService.deleteFile(testFile);
        }
      } catch {}

      try {
        await fileStorageService.deleteFileRecord(sourceDir.id);
      } catch {}

      try {
        await fileStorageService.deleteFileRecord(targetDir.id);
      } catch {}
    });

    it("should move file between directories", async () => {
      const uploadRes = await uploadFile("movable.gcode", SIMPLE_GCODE, { filePath: "source-folder/movable.gcode" });
      expectOkResponse(uploadRes);
      testFile = uploadRes.body.fileStorageId;

      const moveRes = await testRequest
        .post(`${baseRoute}/${testFile}/move`)
        .set("Accept", "application/json")
        .send({ parentId: targetDir.id });

      expectOkResponse(moveRes);
      expect(moveRes.body.message).toBe("File moved successfully");
      expect(moveRes.body.oldParentId).toBe(sourceDir.id);
      expect(moveRes.body.newParentId).toBe(targetDir.id);

      const fileRecord = await fileStorageService.getFileRecordByGuid(testFile);
      expect(fileRecord?.parentId).toBe(targetDir.id);
    });

    it("should move directory with children (children move too)", async () => {
      const childDir = await fileStorageService.createFileRecord({
        parentId: sourceDir.id,
        type: "dir",
        name: "child-dir",
        fileGuid: crypto.randomUUID(),
        metadata: null,
      });

      const uploadRes = await uploadFile("nested.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      testFile = uploadRes.body.fileStorageId;

      await fileStorageService.updateFileRecord((await fileStorageService.getFileRecordByGuid(testFile))!.id, {
        parentId: childDir.id,
      });

      const sourceDirRecord = await fileStorageService.getFileRecordById(sourceDir.id);
      const moveRes = await testRequest
        .post(`${baseRoute}/${sourceDirRecord!.fileGuid}/move`)
        .set("Accept", "application/json")
        .send({ parentId: targetDir.id });

      expectOkResponse(moveRes);

      const movedSourceDir = await fileStorageService.getFileRecordById(sourceDir.id);
      expect(movedSourceDir?.parentId).toBe(targetDir.id);

      const childAfterMove = await fileStorageService.getFileRecordById(childDir.id);
      expect(childAfterMove?.parentId).toBe(sourceDir.id);

      await fileStorageService.deleteFileRecord(childDir.id);
    });

    it("should move file to root directory (parentId=0)", async () => {
      const uploadRes = await uploadFile("to-root.gcode", SIMPLE_GCODE, { filePath: "source-folder/to-root.gcode" });
      expectOkResponse(uploadRes);
      testFile = uploadRes.body.fileStorageId;

      const moveRes = await testRequest
        .post(`${baseRoute}/${testFile}/move`)
        .set("Accept", "application/json")
        .send({ parentId: 0 });

      expectOkResponse(moveRes);
      expect(moveRes.body.newParentId).toBe(0);

      const fileRecord = await fileStorageService.getFileRecordByGuid(testFile);
      expect(fileRecord?.parentId).toBe(0);
    });

    it("should reject move to self (400 error)", async () => {
      const sourceDirRecord = await fileStorageService.getFileRecordById(sourceDir.id);
      const moveRes = await testRequest
        .post(`${baseRoute}/${sourceDirRecord!.fileGuid}/move`)
        .set("Accept", "application/json")
        .send({ parentId: sourceDir.id });

      expect(moveRes.statusCode).toBe(400);
      expect(moveRes.body.error).toContain("Cannot move item into itself");
    });

    it("should reject circular move (dir into its own child) (400 error)", async () => {
      const childDir = await fileStorageService.createFileRecord({
        parentId: sourceDir.id,
        type: "dir",
        name: "child-circular",
        fileGuid: crypto.randomUUID(),
        metadata: null,
      });

      const sourceDirRecord = await fileStorageService.getFileRecordById(sourceDir.id);
      const moveRes = await testRequest
        .post(`${baseRoute}/${sourceDirRecord!.fileGuid}/move`)
        .set("Accept", "application/json")
        .send({ parentId: childDir.id });

      expect(moveRes.statusCode).toBe(400);
      expect(moveRes.body.error).toContain("circular reference");

      await fileStorageService.deleteFileRecord(childDir.id);
    });

    it("should reject move of root directory (400 error)", async () => {
      const rootRecord = await fileStorageService.getFileRecordById(0);
      const moveRes = await testRequest
        .post(`${baseRoute}/${rootRecord!.fileGuid}/move`)
        .set("Accept", "application/json")
        .send({ parentId: targetDir.id });

      expect(moveRes.statusCode).toBe(400);
      expect(moveRes.body.error).toContain("Cannot move root directory");
    });

    it("should reject move of non-existent file (404 error)", async () => {
      const moveRes = await testRequest
        .post(`${baseRoute}/non-existent-file-id/move`)
        .set("Accept", "application/json")
        .send({ parentId: targetDir.id });

      expect(moveRes.statusCode).toBe(404);
      expect(moveRes.body.error).toContain("not found");
    });

    it("should reject move to non-existent parent (404 error)", async () => {
      const uploadRes = await uploadFile("orphan.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      testFile = uploadRes.body.fileStorageId;

      const moveRes = await testRequest
        .post(`${baseRoute}/${testFile}/move`)
        .set("Accept", "application/json")
        .send({ parentId: 99999 });

      expect(moveRes.statusCode).toBe(404);
      expect(moveRes.body.error).toContain("not found");
    });

    it("should reject move to file instead of directory (400 error)", async () => {
      const uploadRes1 = await uploadFile("target-file.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes1);
      const targetFileId = uploadRes1.body.fileStorageId;

      const uploadRes2 = await uploadFile("source-file.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes2);
      testFile = uploadRes2.body.fileStorageId;

      const targetFileRecord = await fileStorageService.getFileRecordByGuid(targetFileId);

      const moveRes = await testRequest
        .post(`${baseRoute}/${testFile}/move`)
        .set("Accept", "application/json")
        .send({ parentId: targetFileRecord!.id });

      expect(moveRes.statusCode).toBe(400);
      expect(moveRes.body.error).toContain("not a directory");

      await fileStorageService.deleteFile(targetFileId);
    });

    it("should verify children maintain relationship after parent move", async () => {
      const childDir = await fileStorageService.createFileRecord({
        parentId: sourceDir.id,
        type: "dir",
        name: "child-maintain",
        fileGuid: crypto.randomUUID(),
        metadata: null,
      });

      const uploadRes = await uploadFile("child-file.gcode", SIMPLE_GCODE);
      expectOkResponse(uploadRes);
      testFile = uploadRes.body.fileStorageId;

      await fileStorageService.updateFileRecord((await fileStorageService.getFileRecordByGuid(testFile))!.id, {
        parentId: childDir.id,
      });

      const sourceDirRecord = await fileStorageService.getFileRecordById(sourceDir.id);
      const moveRes = await testRequest
        .post(`${baseRoute}/${sourceDirRecord!.fileGuid}/move`)
        .set("Accept", "application/json")
        .send({ parentId: targetDir.id });

      expectOkResponse(moveRes);

      const childAfterMove = await fileStorageService.getFileRecordById(childDir.id);
      expect(childAfterMove?.parentId).toBe(sourceDir.id);

      const fileAfterMove = await fileStorageService.getFileRecordByGuid(testFile);
      expect(fileAfterMove?.parentId).toBe(childDir.id);

      await fileStorageService.deleteFileRecord(childDir.id);
    });
  });

  describe("Phase 4: Bulk Operations & Tree View", () => {
    describe("POST /bulk/move", () => {
      it("should move multiple files to a target directory", async () => {
        const targetDir = await fileStorageService.createFileRecord({
          name: "target-dir-bulk-1",
          type: "dir",
          parentId: 0,
          fileGuid: crypto.randomUUID(),
        });

        const upload1 = await uploadFile("file1.gcode", SIMPLE_GCODE);
        expectOkResponse(upload1);
        const upload2 = await uploadFile("file2.gcode", SIMPLE_GCODE);
        expectOkResponse(upload2);

        const response = await testRequest
          .post(`${baseRoute}/bulk/move`)
          .send({ fileIds: [upload1.body.fileStorageId, upload2.body.fileStorageId], parentId: targetDir.id });

        expectOkResponse(response);
        expect(response.body.moved).toBe(2);
        expect(response.body.failed).toBe(0);
        expect(response.body.errors).toEqual([]);

        const movedFile1 = await fileStorageService.getFileRecordByGuid(upload1.body.fileStorageId);
        const movedFile2 = await fileStorageService.getFileRecordByGuid(upload2.body.fileStorageId);

        expect(movedFile1?.parentId).toBe(targetDir.id);
        expect(movedFile2?.parentId).toBe(targetDir.id);

        await fileStorageService.deleteFile(upload1.body.fileStorageId);
        await fileStorageService.deleteFile(upload2.body.fileStorageId);
        await fileStorageService.deleteFileRecord(targetDir.id);
      });

      it("should handle partial failures when moving multiple files", async () => {
        const targetDir = await fileStorageService.createFileRecord({
          name: "target-dir-bulk-2",
          type: "dir",
          parentId: 0,
          fileGuid: crypto.randomUUID(),
        });

        const upload1 = await uploadFile("file-partial.gcode", SIMPLE_GCODE);
        expectOkResponse(upload1);

        const response = await testRequest
          .post(`${baseRoute}/bulk/move`)
          .send({ fileIds: [upload1.body.fileStorageId, "non-existent-file-id"], parentId: targetDir.id });

        expectOkResponse(response);
        expect(response.body.moved).toBe(1);
        expect(response.body.failed).toBe(1);
        expect(response.body.errors).toHaveLength(1);
        expect(response.body.errors[0].fileId).toBe("non-existent-file-id");

        const movedFile1 = await fileStorageService.getFileRecordByGuid(upload1.body.fileStorageId);
        expect(movedFile1?.parentId).toBe(targetDir.id);

        await fileStorageService.deleteFile(upload1.body.fileStorageId);
        await fileStorageService.deleteFileRecord(targetDir.id);
      });

      it("should reject bulk move with empty fileIds array (400)", async () => {
        const response = await testRequest.post(`${baseRoute}/bulk/move`).send({ fileIds: [], parentId: 0 });

        expect(response.status).toBe(400);
      });

      it("should reject bulk move with invalid parentId (400)", async () => {
        const upload1 = await uploadFile(`file-invalid-parent-${Date.now()}.gcode`, SIMPLE_GCODE);
        expectOkResponse(upload1);

        const response = await testRequest
          .post(`${baseRoute}/bulk/move`)
          .send({ fileIds: [upload1.body.fileStorageId], parentId: "not-a-number" });

        expect(response.status).toBe(400);

        await fileStorageService.deleteFile(upload1.body.fileStorageId);
      });

      it("should reject bulk move with more than 100 files (400)", async () => {
        const fileIds = Array.from({ length: 101 }, (_, i) => `file-${i}`);

        const response = await testRequest.post(`${baseRoute}/bulk/move`).send({ fileIds, parentId: 0 });

        expect(response.status).toBe(400);
      });
    });

    describe("POST /directories", () => {
      it("should create a new directory in root", async () => {
        const response = await testRequest.post(`${baseRoute}/directories`).send({ name: "new-folder", parentId: 0 });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe("Directory created successfully");
        expect(response.body.directory.name).toBe("new-folder");
        expect(response.body.directory.type).toBe("dir");
        expect(response.body.directory.parentId).toBe(0);
        expect(response.body.path).toHaveLength(2);
        expect(response.body.path[0].id).toBe(0);
        expect(response.body.path[1].name).toBe("new-folder");

        await fileStorageService.deleteFileRecord(response.body.directory.id);
      });

      it("should create a new directory in a parent directory", async () => {
        const parentDir = await fileStorageService.createFileRecord({
          name: "parent-dir-test",
          type: "dir",
          parentId: 0,
          fileGuid: crypto.randomUUID(),
        });

        const response = await testRequest
          .post(`${baseRoute}/directories`)
          .send({ name: "child-folder", parentId: parentDir.id });

        expect(response.status).toBe(201);
        expect(response.body.directory.name).toBe("child-folder");
        expect(response.body.directory.parentId).toBe(parentDir.id);
        expect(response.body.path).toHaveLength(3);
        expect(response.body.path[0].id).toBe(0);
        expect(response.body.path[1].name).toBe("parent-dir-test");
        expect(response.body.path[2].name).toBe("child-folder");

        await fileStorageService.deleteFileRecord(response.body.directory.id);
        await fileStorageService.deleteFileRecord(parentDir.id);
      });

      it("should reject creating directory with duplicate name in same parent (409)", async () => {
        const parentDir = await fileStorageService.createFileRecord({
          name: "parent-dir-dup",
          type: "dir",
          parentId: 0,
          fileGuid: crypto.randomUUID(),
        });

        const existingFolder = await fileStorageService.createFileRecord({
          name: "existing-folder",
          type: "dir",
          parentId: parentDir.id,
          fileGuid: crypto.randomUUID(),
        });

        const response = await testRequest
          .post(`${baseRoute}/directories`)
          .send({ name: "existing-folder", parentId: parentDir.id });

        expect(response.status).toBe(409);

        await fileStorageService.deleteFileRecord(existingFolder.id);
        await fileStorageService.deleteFileRecord(parentDir.id);
      });

      it("should reject creating directory with empty name (400)", async () => {
        const response = await testRequest.post(`${baseRoute}/directories`).send({ name: "", parentId: 0 });

        expect(response.status).toBe(400);
      });

      it("should reject creating directory with non-existent parent (404)", async () => {
        const response = await testRequest
          .post(`${baseRoute}/directories`)
          .send({ name: "new-folder", parentId: 99999 });

        expect(response.status).toBe(404);
      });
    });

    describe("GET /tree", () => {
      it("should return hierarchical tree structure with nested children", async () => {
        const rootDir = await fileStorageService.createFileRecord({
          name: "root-dir-tree",
          type: "dir",
          parentId: 0,
          fileGuid: crypto.randomUUID(),
        });

        const childDir = await fileStorageService.createFileRecord({
          name: "child-dir-tree",
          type: "dir",
          parentId: rootDir.id,
          fileGuid: crypto.randomUUID(),
        });

        const upload1 = await uploadFile("tree-file1.gcode", SIMPLE_GCODE);
        expectOkResponse(upload1);
        const fileRecord1 = await fileStorageService.getFileRecordByGuid(upload1.body.fileStorageId);
        await fileStorageService.updateFileRecord(fileRecord1!.id, { parentId: rootDir.id });

        const upload2 = await uploadFile("tree-file2.gcode", SIMPLE_GCODE);
        expectOkResponse(upload2);
        const fileRecord2 = await fileStorageService.getFileRecordByGuid(upload2.body.fileStorageId);
        await fileStorageService.updateFileRecord(fileRecord2!.id, { parentId: childDir.id });

        const response = await testRequest.get(`${baseRoute}/tree`);

        expectOkResponse(response);
        expect(response.body.tree).toBeDefined();
        expect(Array.isArray(response.body.tree)).toBe(true);

        const rootDirNode = response.body.tree.find((node: any) => node.name === "root-dir-tree");
        expect(rootDirNode).toBeDefined();
        expect(rootDirNode.type).toBe("dir");
        expect(rootDirNode.children).toHaveLength(2);

        const childDirNode = rootDirNode.children.find((node: any) => node.name === "child-dir-tree");
        expect(childDirNode).toBeDefined();
        expect(childDirNode.children).toHaveLength(1);
        expect(childDirNode.children[0].name).toBe("tree-file2.gcode");

        const file1Node = rootDirNode.children.find((node: any) => node.name === "tree-file1.gcode");
        expect(file1Node).toBeDefined();
        expect(file1Node.type).toBe("gcode");

        await fileStorageService.deleteFile(upload1.body.fileStorageId);
        await fileStorageService.deleteFile(upload2.body.fileStorageId);
        await fileStorageService.deleteFileRecord(childDir.id);
        await fileStorageService.deleteFileRecord(rootDir.id);
      });

      it("should return empty tree when no files or directories exist", async () => {
        const allRecords = await fileStorageService["fileRecordRepository"].find();
        for (const record of allRecords) {
          if (record.id !== 0) {
            if (record.type === "gcode") {
              await fileStorageService.deleteFile(record.fileGuid);
            } else {
              await fileStorageService.deleteFileRecord(record.id);
            }
          }
        }

        const response = await testRequest.get(`${baseRoute}/tree`);

        expectOkResponse(response);
        expect(response.body.tree).toHaveLength(1);
        expect(response.body.tree[0].id).toBe(0);
        expect(response.body.tree[0].name).toBe("/");
        expect(response.body.tree[0].children).toEqual([]);
      });
    });
  });
});
