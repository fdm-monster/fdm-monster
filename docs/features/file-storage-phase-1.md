# File Storage Phase 1 — FileRecord Entity & CRUD API

**Category:** Feature
**Status:** In Progress
**Version:** v0.1.0-phase-1
**Last Updated:** 2026-03-13

## Overview

Create a discrete file lookup table (`FileRecord`) to support CRUD operations in `file-storage.service.ts`. This is Phase 1 of the Project Foundation & Infrastructure effort, establishing a hierarchical file system abstraction backed by SQLite.

## Motivation

**Problem:** The current `FileStorageService` manages files on disk but has no database representation for file system hierarchy, making directory operations, path lookups, and metadata queries difficult.

**Solution:** Introduce a `FileRecord` entity that:
- Represents both files and directories in a hierarchical structure
- Provides indexed lookups via `fileGuid` (UUID)
- Supports CRUD operations via `FileStorageService`
- Maintains clean separation: this table is **only** for `file-storage.service.ts` functions

**Scope Limitation (Phase 1):**
- ✅ File lookup table with hierarchy support
- ✅ CRUD methods in `FileStorageService`
- ❌ No changes to printer-related functions
- ❌ No integration with `PrintJob` entity (reserved for future phases)

## Specification

### FileRecord Entity

```typescript
@Entity()
export class FileRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: true })
  parentId: number | null;

  @Column({ type: "varchar", nullable: false })
  type: FileRecordType; // "dir" | "gcode" | "bgcode" | "3mf"

  @Column({ type: "varchar", nullable: false })
  name: string;

  @Column({ type: "varchar", nullable: false, unique: true })
  @Index()
  fileGuid: string; // UUID, indexed for fast lookups

  @Column({ type: "text", nullable: true })
  metadata: string | null; // Long JSON text, nullable

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Root Directory

The migration seeds a root directory record:

```sql
INSERT INTO "file_record" ("id", "parentId", "type", "name", "fileGuid", "metadata")
VALUES (0, 0, 'dir', '/', '00000000-0000-0000-0000-000000000000', NULL)
```

**Properties:**
- `id = 0` — Primary key (root entry)
- `parentId = 0` — Self-referential (root has no parent)
- `type = 'dir'` — Directory type
- `name = '/'` — Root path name
- `fileGuid = '00000000-0000-0000-0000-000000000000'` — Reserved UUID

### CRUD API Surface

The following methods will be added to `FileStorageService`:

| Method | Purpose |
|--------|---------|
| `listFileRecords()` | List all file records (optionally filtered by parentId) |
| `getFileRecordById(id)` | Get file record by primary key |
| `getFileRecordByGuid(guid)` | Get file record by fileGuid (indexed) |
| `createFileRecord(data)` | Create new file/directory record |
| `updateFileRecord(id, data)` | Update existing record |
| `deleteFileRecord(id)` | Delete record (cascades to children if directory) |

## Database Schema

**Table:** `file_record`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Primary key |
| `parentId` | INTEGER | NULLABLE | Foreign key to parent directory (null = orphan) |
| `type` | VARCHAR | NOT NULL | File type: `dir`, `gcode`, `bgcode`, `3mf` |
| `name` | VARCHAR | NOT NULL | File or directory name |
| `fileGuid` | VARCHAR | NOT NULL, UNIQUE, INDEXED | UUID for file lookups |
| `metadata` | TEXT | NULLABLE | JSON metadata (long text) |
| `createdAt` | DATETIME | NOT NULL, DEFAULT now() | Creation timestamp |
| `updatedAt` | DATETIME | NOT NULL, DEFAULT now() | Last update timestamp |

**Indices:**
- `IDX_file_record_fileGuid` on `fileGuid` (unique index)

## Migration

**File:** `src/migrations/1773442074582-CreateFileRecordTable.ts`

**Up:**
1. Create `file_record` table
2. Add UNIQUE constraint on `fileGuid`
3. Create index on `fileGuid`
4. Seed root directory (id=0)

**Down:**
1. Drop index
2. Drop table

## Implementation Phases

### Phase 1.2 — Entity & Migration (Complete ✓)
- ✅ Created `src/entities/file-record.entity.ts`
- ✅ Created `src/migrations/1773442074582-CreateFileRecordTable.ts`

### Phase 1.3 — Service Layer CRUD Methods (Next)
- Add CRUD methods to `FileStorageService`
- Inject `FileRecord` repository via TypeORM
- Implement hierarchy queries (children, ancestors)

### Phase 1.4 — Integration Tests
- Test CRUD operations
- Verify root directory seed
- Test hierarchy constraints
- ≥80% code coverage per Rule 7

## Benefits

| Benefit | Impact |
|---------|--------|
| **Hierarchical structure** | Enables directory/folder organization |
| **Indexed lookups** | O(1) GUID-based queries instead of filesystem scans |
| **CRUD abstraction** | Clean API for file system operations |
| **Future extensibility** | Foundation for permissions, tags, versioning |

## Scope Boundaries

**In Scope (Phase 1):**
- `FileRecord` entity and migration
- CRUD methods in `FileStorageService`
- Unit tests for service layer

**Out of Scope (Future Phases):**
- Integration with `PrintJob` entity
- Controller endpoints for file CRUD
- Printer-related file operations
- File upload/download integration

## Related Documents

- `DEVELOPMENT.md` — Phase-by-phase progress tracking
- `FileStoragePhase1_EntityAndMigration.md` — Original planning document
- `.cursorrules` — Development conventions

## Open Questions

- Should `parentId` have a foreign key constraint to `file_record.id`?
- Should deletion cascade to children, or prevent deletion if children exist?
- Should the root directory (id=0) be immutable via application logic?
