import { AwilixContainer } from "awilix";
import { DITokens } from "@/container.tokens";
import { FileStorageService } from "@/services/file-storage.service";
import { setupTestApp } from "../test-server";
import { randomUUID } from "node:crypto";
import { ConflictException, NotFoundException } from "@/exceptions/runtime.exceptions";
import { FileRecord } from "@/entities/file-record.entity";

let container: AwilixContainer;
let service: FileStorageService;

beforeAll(async () => {
  ({ container } = await setupTestApp(false, undefined, true, false));
  service = container.resolve<FileStorageService>(DITokens.fileStorageService);
});

describe("FileStorageService - FileRecord CRUD", () => {
  describe("root directory seed", () => {
    it("should have root directory at id=0 after migration", async () => {
      const root = await service.getFileRecordById(0);

      expect(root).toBeTruthy();
      expect(root?.id).toBe(0);
      expect(root?.parentId).toBe(0);
      expect(root?.type).toBe("dir");
      expect(root?.name).toBe("/");
      expect(root?.fileGuid).toBe("00000000-0000-0000-0000-000000000000");
    });
  });

  describe("listFileRecords", () => {
    it("should return all records when no parentId provided", async () => {
      const guid1 = randomUUID();
      const guid2 = randomUUID();

      await service.createFileRecord({
        parentId: 0,
        type: "gcode",
        name: "file1.gcode",
        fileGuid: guid1,
      });
      await service.createFileRecord({
        parentId: 0,
        type: "3mf",
        name: "file2.3mf",
        fileGuid: guid2,
      });

      const records = await service.listFileRecords();

      expect(records.length).toBeGreaterThanOrEqual(3);
      expect(records.some(r => r.fileGuid === guid1)).toBe(true);
      expect(records.some(r => r.fileGuid === guid2)).toBe(true);
    });

    it("should filter by parentId when provided", async () => {
      const dirGuid = randomUUID();
      const fileGuid = randomUUID();

      const dir = await service.createFileRecord({
        parentId: 0,
        type: "dir",
        name: "subdir",
        fileGuid: dirGuid,
      });

      await service.createFileRecord({
        parentId: dir.id,
        type: "gcode",
        name: "nested.gcode",
        fileGuid: fileGuid,
      });

      const children = await service.listFileRecords(dir.id);

      expect(children.length).toBe(1);
      expect(children[0].fileGuid).toBe(fileGuid);
      expect(children[0].parentId).toBe(dir.id);
    });

    it("should return empty array when parentId has no children", async () => {
      const children = await service.listFileRecords(99999);

      expect(children).toEqual([]);
    });
  });

  describe("getFileRecordById", () => {
    it("should return record when ID exists", async () => {
      const guid = randomUUID();
      const created = await service.createFileRecord({
        parentId: 0,
        type: "bgcode",
        name: "test.bgcode",
        fileGuid: guid,
      });

      const record = await service.getFileRecordById(created.id);

      expect(record).toBeTruthy();
      expect(record?.id).toBe(created.id);
      expect(record?.name).toBe("test.bgcode");
      expect(record?.type).toBe("bgcode");
    });

    it("should return null when ID does not exist", async () => {
      const record = await service.getFileRecordById(999999);

      expect(record).toBeNull();
    });
  });

  describe("getFileRecordByGuid", () => {
    it("should return record when GUID exists", async () => {
      const guid = randomUUID();
      await service.createFileRecord({
        parentId: 0,
        type: "gcode",
        name: "guid-test.gcode",
        fileGuid: guid,
      });

      const record = await service.getFileRecordByGuid(guid);

      expect(record).toBeTruthy();
      expect(record?.fileGuid).toBe(guid);
      expect(record?.name).toBe("guid-test.gcode");
    });

    it("should return null when GUID does not exist", async () => {
      const record = await service.getFileRecordByGuid(randomUUID());

      expect(record).toBeNull();
    });
  });

  describe("createFileRecord", () => {
    it("should create record with valid data", async () => {
      const guid = randomUUID();
      const metadata = JSON.stringify({ size: 1024, hash: "abc123" });

      const record = await service.createFileRecord({
        parentId: 0,
        type: "gcode",
        name: "create-test.gcode",
        fileGuid: guid,
        metadata,
      });

      expect(record.id).toBeDefined();
      expect(record.name).toBe("create-test.gcode");
      expect(record.type).toBe("gcode");
      expect(record.fileGuid).toBe(guid);
      expect(record.metadata).toBe(metadata);
      expect(record.createdAt).toBeInstanceOf(Date);
      expect(record.updatedAt).toBeInstanceOf(Date);
    });

    it("should create directory record with type='dir'", async () => {
      const guid = randomUUID();

      const record = await service.createFileRecord({
        parentId: 0,
        type: "dir",
        name: "testdir",
        fileGuid: guid,
      });

      expect(record.type).toBe("dir");
      expect(record.name).toBe("testdir");
    });

    it("should create file record with type='3mf'", async () => {
      const guid = randomUUID();

      const record = await service.createFileRecord({
        parentId: 0,
        type: "3mf",
        name: "model.3mf",
        fileGuid: guid,
      });

      expect(record.type).toBe("3mf");
      expect(record.name).toBe("model.3mf");
    });

    it("should throw ConflictException when fileGuid already exists", async () => {
      const guid = randomUUID();

      await service.createFileRecord({
        parentId: 0,
        type: "gcode",
        name: "first.gcode",
        fileGuid: guid,
      });

      await expect(
        service.createFileRecord({
          parentId: 0,
          type: "gcode",
          name: "second.gcode",
          fileGuid: guid,
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("updateFileRecord", () => {
    it("should update record with valid data", async () => {
      const guid = randomUUID();
      const created = await service.createFileRecord({
        parentId: 0,
        type: "gcode",
        name: "original.gcode",
        fileGuid: guid,
      });

      const updated = await service.updateFileRecord(created.id, {
        name: "renamed.gcode",
        metadata: JSON.stringify({ updated: true }),
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe("renamed.gcode");
      expect(updated.metadata).toBe(JSON.stringify({ updated: true }));
      expect(updated.fileGuid).toBe(guid);
    });

    it("should throw NotFoundException when ID does not exist", async () => {
      await expect(
        service.updateFileRecord(999999, { name: "nonexistent.gcode" })
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException when changing fileGuid to existing GUID", async () => {
      const guid1 = randomUUID();
      const guid2 = randomUUID();

      const record1 = await service.createFileRecord({
        parentId: 0,
        type: "gcode",
        name: "file1.gcode",
        fileGuid: guid1,
      });

      await service.createFileRecord({
        parentId: 0,
        type: "gcode",
        name: "file2.gcode",
        fileGuid: guid2,
      });

      await expect(
        service.updateFileRecord(record1.id, { fileGuid: guid2 })
      ).rejects.toThrow(ConflictException);
    });

    it("should allow updating fileGuid to same value", async () => {
      const guid = randomUUID();
      const created = await service.createFileRecord({
        parentId: 0,
        type: "gcode",
        name: "same-guid.gcode",
        fileGuid: guid,
      });

      const updated = await service.updateFileRecord(created.id, {
        fileGuid: guid,
        name: "updated-name.gcode",
      });

      expect(updated.fileGuid).toBe(guid);
      expect(updated.name).toBe("updated-name.gcode");
    });
  });

  describe("deleteFileRecord", () => {
    it("should delete record when ID exists", async () => {
      const guid = randomUUID();
      const created = await service.createFileRecord({
        parentId: 0,
        type: "gcode",
        name: "to-delete.gcode",
        fileGuid: guid,
      });

      await service.deleteFileRecord(created.id);

      const deleted = await service.getFileRecordById(created.id);
      expect(deleted).toBeNull();
    });

    it("should throw NotFoundException when ID does not exist", async () => {
      await expect(
        service.deleteFileRecord(999999)
      ).rejects.toThrow(NotFoundException);
    });

    it("should allow deleting record after deletion attempt", async () => {
      const guid = randomUUID();
      const created = await service.createFileRecord({
        parentId: 0,
        type: "gcode",
        name: "delete-twice.gcode",
        fileGuid: guid,
      });

      await service.deleteFileRecord(created.id);

      await expect(
        service.deleteFileRecord(created.id)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("listAllFiles - orphaned record cleanup", () => {
    it("should detect and delete orphaned FileRecords during listing", async () => {
      // Create a FileRecord without a physical file (orphaned)
      const orphanedGuid = randomUUID();
      const orphanedRecord = await service.createFileRecord({
        parentId: 0,
        type: "gcode",
        name: "orphaned.gcode",
        fileGuid: orphanedGuid,
      });

      // Verify it exists in database
      const beforeList = await service.getFileRecordById(orphanedRecord.id);
      expect(beforeList).toBeTruthy();

      // List files - should trigger orphan cleanup
      await service.listAllFiles({ page: 1, pageSize: 50 });

      // Verify orphaned record was deleted
      const afterList = await service.getFileRecordById(orphanedRecord.id);
      expect(afterList).toBeNull();
    });

    it("should not delete directory records during orphan cleanup", async () => {
      // Create a directory record (no physical file expected)
      const dirGuid = randomUUID();
      const dirRecord = await service.createFileRecord({
        parentId: 0,
        type: "dir",
        name: "test-directory",
        fileGuid: dirGuid,
      });

      // Verify it exists
      const beforeList = await service.getFileRecordById(dirRecord.id);
      expect(beforeList).toBeTruthy();

      // List files - should NOT delete directory records
      await service.listAllFiles({ page: 1, pageSize: 50 });

      // Verify directory still exists after listing
      const afterList = await service.getFileRecordById(dirRecord.id);
      expect(afterList).toBeTruthy();
      expect(afterList?.type).toBe("dir");
    });


    it("should batch delete multiple orphaned records efficiently", async () => {
      // Create 5 orphaned records
      const orphanGuids = Array.from({ length: 5 }, () => randomUUID());
      const orphanRecords = await Promise.all(
        orphanGuids.map((guid, idx) =>
          service.createFileRecord({
            parentId: 0,
            type: "gcode",
            name: `batch-orphan-${idx}.gcode`,
            fileGuid: guid,
          })
        )
      );

      // Verify all exist before listing
      const beforeCount = await Promise.all(
        orphanRecords.map(r => service.getFileRecordById(r.id))
      );
      expect(beforeCount.filter(r => r !== null).length).toBe(5);

      // List files - should delete all orphans in one batch
      await service.listAllFiles({ page: 1, pageSize: 50 });

      // Verify all deleted after listing
      const afterCount = await Promise.all(
        orphanRecords.map(r => service.getFileRecordById(r.id))
      );
      expect(afterCount.filter(r => r !== null).length).toBe(0);
    });
  });
});
