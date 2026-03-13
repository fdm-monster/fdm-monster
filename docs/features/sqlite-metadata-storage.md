# SQLite Metadata Storage — Feature Proposal

**Category:** Feature  
**Status:** Approved  
**Version:** 1.0  
**Last Updated:** 2026-03-13

## Overview

Migrate file metadata storage from JSON sidecar files to a dedicated SQLite table (\`FileRecord\`), enabling queryable indices, transactional consistency, and cleaner domain separation.

## Motivation

**Problem:** Currently, file metadata lives in two places:
1. JSON sidecar files (\`.gcode.json\`, \`.3mf.json\`) on disk
2. \`PrintJob.metadata\` JSON column in SQLite

This creates:
- **Data consistency issues**: Two sources of truth
- **Performance issues**: O(n) directory scans on duplicate detection
- **Domain confusion**: \`PrintJob\` entity mixes job lifecycle with file identity

**Solution:** Create a dedicated \`FileRecord\` entity in SQLite:
- Single source of truth for file metadata
- Indexed queries on \`fileHash\` and \`originalFileName\`
- Clear separation of concerns: \`FileRecord\` = file identity, \`PrintJob\` = job state

## Specification

### FileRecord Entity

\`\`\`typescript
@Entity("file_records")
export class FileRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", unique: true, nullable: false })
  fileStorageId: string; // UUID, same as current FileStorageService ID

  @Column({ type: "varchar", nullable: false })
  fileHash: string; // SHA256, indexed for deduplication

  @Column({ type: "varchar", nullable: false, index: true })
  originalFileName: string; // For user-friendly identification

  @Column({ type: "varchar", nullable: false })
  fileFormat: "gcode" | "bgcode" | "3mf"; // File format

  @Column({ type: "int", nullable: true })
  fileSize: number; // Bytes

  @Column({ type: "json", nullable: true })
  metadata: PrintJobMetadata; // Full metadata from analysis

  @Column({ type: "json", nullable: true })
  thumbnails: Array<{
    index: number;
    width: number;
    height: number;
    format: string;
    size: number;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "varchar", nullable: true })
  uploadedBy: string; // Username or ID of uploader
}
\`\`\`

### Changes to PrintJob

\`\`\`typescript
// Before
@Column({ type: "json", nullable: true })
metadata: PrintJobMetadata | null;

// After — remove; use FileRecord instead
// PrintJob.fileStorageId now just links to FileRecord.fileStorageId
\`\`\`

### Migration Path

**Phase 1 (v0.2.0-phase-1):**
- Create \`FileRecord\` entity
- Create TypeORM migration to add \`file_records\` table
- Create \`FileRecordService\` for CRUD

**Phase 2 (v0.2.0-phase-2):**
- Update \`FileStorageService\` to create \`FileRecord\` on \`saveFile()\`
- Dual-read logic: if \`FileRecord\` exists, use it; else read JSON (backward compat)
- Update \`PrinterFilesController\` and \`FileStorageController\` to use new service

**Phase 3 (v0.2.0-phase-3):**
- Migration script: iterate all JSON sidecars → create \`FileRecord\` rows
- Run in maintenance window or via optional CLI task

**Phase 4 (v0.2.0-phase-4):**
- Remove JSON sidecar fallback code
- Full test coverage for \`FileRecordService\`
- Update documentation

## Benefits

| Benefit | Impact |
|---------|--------|
| **Queryable indices** | O(1) duplicate detection instead of O(n) directory scan |
| **Single source of truth** | Eliminate JSON sidecar consistency issues |
| **Domain clarity** | \`FileRecord\` ≠ \`PrintJob\` ≠ \`PrinterFile\` |
| **Transactional integrity** | Upload, analyze, and persist happen in one DB transaction |
| **Future extensibility** | Easy to add file tags, user ownership, access control |

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Data loss during migration** | Backup JSON sidecars; dual-read during transition; rollback possible |
| **Downtime** | Migration runs offline; service unavailable during 10-30 min migration |
| **Compatibility** | Dual-read logic maintains backward compatibility for 1+ release |

## Related Documents

- [\`../architecture/file-storage.md\`](../architecture/file-storage.md) — Current architecture
- [\`../api/file-storage-api.md\`](../api/file-storage-api.md) — API changes
- \`DEVELOPMENT.md\` — Phase-by-phase progress tracking

## Open Questions

- Should uploaded-by tracking be added? (Access control feature)
- Retention policy: auto-delete unused files after N days?
- Should \`FileRecord\` track usage count (jobs referencing it)?
