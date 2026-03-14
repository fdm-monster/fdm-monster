# FDM Monster — Development Changelog

This document tracks all development efforts, phases, and changes made to the project using semantic versioning and effort-based organization.

---

## Overview

- **Project:** FDM Monster (3D printer farm management server)
- **Repository:** fdm-monster/fdm-monster
- **Last Updated:** 2026-03-13
- **Development Paradigm:** AI-assisted, effort-based phases with explicit phase transitions

---

## Active Efforts

*(In progress; not yet closed)*

### Effort: File Management CRUD API (v0.3.0)

**Status:** ✓ Phase 3 Complete — Awaiting Closure Approval
**Phase:** 3 of 4 — Pagination, Filtering & PATCH Endpoint
**Started:** 2026-03-13
**Phase 1 Completed:** 2026-03-13
**Phase 2 Completed:** 2026-03-13
**Phase 3 Completed:** 2026-03-13

#### Phase 3 — Pagination, Filtering & PATCH Endpoint ✓

**Objective:** Add pagination, filtering, sorting to list endpoint and PATCH endpoint for file renaming

**Requirements (Validated ✅)**
1. Pagination support (page, pageSize, totalCount, totalPages)
2. Filtering by file type (gcode/3mf/bgcode)
3. Sorting by createdAt, name, or type
4. PATCH endpoint for renaming files

### Changes
- `src/services/file-storage.service.ts` — Enhanced FileRecord querying
  - `listFileRecords()` now supports pagination/filtering/sorting options (lines 510-547)
  - `listAllFiles()` returns paginated results with metadata (lines 430-491)
- `src/controllers/file-storage.controller.ts` — Enhanced API endpoints
  - GET `/api/file-storage` accepts query params (page, pageSize, type, sortBy, sortOrder) (lines 29-75)
  - PATCH `/api/file-storage/:id` for renaming files (lines 118-166)

### Test Coverage
- `test/api/file-storage-controller-integration.test.ts` — 27 tests, all passing
  - Phase 1 tests (16 tests) - Basic endpoints
  - Phase 2 tests (5 tests) - FileRecord integration
  - Phase 3 tests (6 tests) - Pagination, filtering, sorting, PATCH:
    - Pagination with page/pageSize
    - Filter by file type
    - Sort by name (ASC/DESC)
    - PATCH rename file (success, 404, 400)

### API Changes
- **GET /api/file-storage** - Added query parameters:
  - `?page=1&pageSize=20` - Pagination (default: page=1, pageSize=50)
  - `?type=gcode` - Filter by file type
  - `?sortBy=name&sortOrder=ASC` - Sort results
  - Response includes: `page`, `pageSize`, `totalCount`, `totalPages`
- **PATCH /api/file-storage/:id** - New endpoint:
  - Body: `{ "originalFileName": "new-name.gcode" }`
  - Updates FileRecord name and metadata JSON sidecar
  - Returns: `{ "message", "fileStorageId", "fileName" }`

### Deferred from Phase 4
- Permission-based access control → See `docs/features/file-storage-permissions-deferred.md`

### Next: Phase 4 — Bulk Operations
- POST /api/file-storage/bulk/delete
- POST /api/file-storage/bulk/analyze

#### Phase 2 — FileRecord Integration ✓

**Objective:** Integrate FileRecord entity with existing FileStorage upload/delete/list operations

**Requirements (Validated ✅)**
1. Create FileRecord on file upload
2. Delete FileRecord on file deletion
3. List files from FileRecords instead of filesystem scan
4. Backfill script for existing files

### Changes
- `src/services/file-storage.service.ts` — Integrated FileRecord CRUD into upload/delete/list flows
  - `saveFile()` creates FileRecord after physical file save (lines 130-136)
  - `deleteFile()` deletes FileRecord after physical file delete (lines 174-177)
  - `listAllFiles()` queries FileRecords instead of filesystem scan (lines 440-472)

### New Files
- `src/tasks/backfill-file-records.task.ts` — Backfill FileRecords for existing files on disk
- `test/api/file-storage-controller-integration.test.ts` — Extended with 5 FileRecord integration tests (21 tests total)

### Test Coverage
- `test/api/file-storage-controller-integration.test.ts` — 21 tests, all passing
  - Phase 1 tests (16 tests) - FileStorage API endpoints
  - Phase 2 tests (5 tests) - FileRecord integration:
    - FileRecord creation on upload
    - FileRecord deletion on delete
    - List files from FileRecords
    - File type categorization (gcode/3mf/bgcode)

### Deferred from Phase 4
- Permission-based access control → See `docs/features/file-storage-permissions-deferred.md`

#### Phase 1 — FileStorage API Integration Testing ✓

**Objective:** Create real integration tests for FileStorageController endpoints without service mocks

**Requirements (Validated ✅)**
1. Integration tests for all 6 existing FileStorage endpoints
2. Tests use real file operations (no service mocks)
3. Tests verify full upload-analyze-delete workflow
4. Coverage for concurrent operations and error cases

### New Files
- `test/api/file-storage-controller-integration.test.ts` — 16 integration tests for FileStorageController

---

## Closed Efforts

*(Completed and stable)*

### Effort: Project Foundation & Infrastructure (v0.1.0)

**Status:** ✓ Closed
**Phase:** 1 of 3 — File Storage Entity & CRUD Implementation
**Started:** 2026-03-13
**Completed:** 2026-03-13

#### Phase 1 — File Storage Entity & CRUD Implementation ✓

**Objective:** Create discrete FileRecord table with CRUD operations for file-storage.service.ts

**Requirements (Validated ✅)**
1. File lookup table for CRUD support in Files API only
2. Schema fields: id, parentId, type, name, fileGuid, metadata, createdAt, updatedAt
3. Root directory seed: `(0, 0, 'dir', '/', '00000000-0000-0000-0000-000000000000', NULL)`
4. Scope: file-storage.service.ts functions only
5. No changes to printer functions

### Changes
- `src/services/file-storage.service.ts` — Added FileRecord repository injection and 6 CRUD methods (lines 40, 47, 496-569)
- `src/entities/index.ts` — Exported FileRecord entity
- `src/data-source.ts` — Registered FileRecord entity and CreateFileRecordTable migration

### New Files
- `src/entities/file-record.entity.ts` — FileRecord TypeORM entity with 8 fields (id, parentId, type, name, fileGuid, metadata, createdAt, updatedAt)
- `src/migrations/1773442074582-CreateFileRecordTable.ts` — Database migration with root directory seed
- `docs/features/file-storage-phase-1.md` — Phase 1 design document and specification
- `test/application/file-storage.service.test.ts` — Unit tests for CRUD methods (19 tests, 100% coverage)

### Database/Migration
- Migration: `1773442074582-CreateFileRecordTable.ts`
- New table: `file_record` with UNIQUE constraint on `fileGuid` and index
- Seed data: Root directory at id=0 with self-referential parent
- Non-breaking: No existing tables modified

### Test Coverage
- `test/application/file-storage.service.test.ts` — 19 tests, 100% coverage of new CRUD methods
  - Root directory seed validation (1 test)
  - listFileRecords() with/without filters (3 tests)
  - getFileRecordById() success/failure (2 tests)
  - getFileRecordByGuid() indexed lookup (2 tests)
  - createFileRecord() with validation (4 tests)
  - updateFileRecord() with conflict detection (4 tests)
  - deleteFileRecord() with error handling (3 tests)

### API Changes
- None (internal service methods only, no HTTP endpoints)

### Known Issues / Next Phase
- None blocking
- Next: Phase 2 could add controller endpoints or integrate with PrintJob entity

---

## Closed Efforts

*(Completed and stable)*

*(None yet)*

---

## Planning & Roadmap

### Queued Efforts (Not Yet Started)

1. **Effort: SQLite Metadata Storage (v0.2.0)**
   - Migrate file metadata from JSON sidecars to dedicated TypeORM `FileRecord` entity
   - Create queryable indices for `fileHash`, `originalFileName`, `fileStorageId`
   - Maintain referential integrity between `PrintJob` and `FileRecord`
   - Phases: Design → Implementation → Migration → Testing

2. **Effort: File Management CRUD API (v0.3.0)**
   - Add missing endpoints: `PATCH`, bulk delete, pagination, manual job creation
   - Enhance permission system (add `PERMS.FileStorage.*` constants)
   - Full test coverage for all endpoints
   - Phases: API Design → Controller Implementation → Service Layer → Testing

3. **Effort: Multi-Plate 3MF Support (v0.4.0)**
   - Wire `analyzeMultiPlate3MF()` into upload flow
   - Create one job per plate; handle thumbnails per plate
   - Update UI/API to represent multi-plate jobs
   - Phases: Analysis → Storage → API → UI

4. **Effort: Moonraker Metadata Normalization (v0.5.0)**
   - Create mapper to normalize `ServerFileMetadataDto` → `PrintJobMetadata`
   - Integrate with existing metadata storage
   - Phases: Design → Mapper Implementation → Integration Tests

5. **Effort: Thumbnail Format Handling (v0.6.0)**
   - Support QOI format conversion (to PNG or base64)
   - Unified thumbnail API
   - Phases: Format Support → API Enhancement → Testing

---

## Effort Template

Use this template when logging new efforts:

\`\`\`markdown
## Effort: [Effort Name] (v[semver])

**Status:** In Progress | ✓ Closed  
**Phase:** [Phase N] of [Total] — [Phase Name]  
**Started:** YYYY-MM-DD  
**Closed:** YYYY-MM-DD (if completed)  

### Changes
- \`src/path/to/file.ts\` — [brief purpose]
- \`src/another/file.ts\` — [purpose]

### New Files
- \`src/entities/new.entity.ts\` — [purpose]
- \`docs/feature.md\` — [purpose]

### Deleted Files
- \`src/deprecated.ts\` — [reason]

### API Changes
- \`POST /api/endpoint\` → \`PATCH /api/endpoint\` (request body changed)
- \`GET /api/new-endpoint\` (new)

### Database/Migration
- Migration: \`TIMESTAMP-DescriptiveName.ts\`
- Breaking: [List any schema changes]

### Test Coverage
- \`test/api/endpoints.test.ts\` — [coverage description]
- \`test/services/logic.test.ts\` — [coverage description]

### Known Issues / Next Phase
- [Any blockers or notes for next phase]

---
\`\`\`

---

## Conventions

### Versioning
- **Major (X.0.0):** Significant architecture changes or breaking API changes
- **Minor (0.X.0):** New features, non-breaking additions
- **Patch (0.0.X):** Bug fixes, documentation updates
- **Phase Suffix:** \`-phase-1\`, \`-phase-2\`, etc. during active development; drop suffix when effort closes

### File Paths
- Relative to project root (\`fdm-monster/\`)
- Format: \`\`src/path/to/file.ts\`\` (backticks, Unix-style separators)

### Change Types
- **New Files** — Created during effort
- **Modified Files** — Updated; list in Changes section
- **Deleted Files** — Removed; explain why
- **API Changes** — Endpoint signatures, request/response formats
- **Database** — Entity changes, migrations, schema updates

---

## Related Documents

- **[\.cursorrules](./.cursorrules)** — AI development rules and conventions
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Contribution guidelines for human developers
- **[README.md](./README.md)** — Project overview and user guide
- **[docs/](./docs/)** — Feature and architecture documentation

---

## Quick Stats

| Metric | Value |
|--------|-------|
| Total Efforts (All Time) | 2 |
| Closed Efforts | 1 |
| Active Phases | 1 (pending closure) |
| Files Created (YTD) | 5 |
| Files Modified (YTD) | 3 |

---

## Index of All Files

### Root-Level Configuration
- \`.cursorrules\` — AI development rules
- \`DEVELOPMENT.md\` — This file
- \`package.json\` — Node.js dependencies and scripts
- \`tsconfig.json\` — TypeScript configuration
- \`biome.json\` — Code linter/formatter configuration
- \`jest.config.js\` — Jest test runner configuration

### Source Code (\`src/\`)
See directory structure in [.cursorrules](./.cursorrules) under "Key Directories"

### Tests (\`test/\`)
Mirror of \`src/\` structure with \`*.test.ts\` files

### Documentation (\`docs/\`)
- \`docs/architecture/\` — Architecture decision records
- \`docs/guides/\` — User guides and tutorials
- \`docs/api/\` — API documentation
- \`docs/features/\` — Feature design documents

---

## Questions or Feedback?

If a rule, phase tracking approach, or documentation format needs adjustment, file an issue or discuss during phase confirmation.

**Last reviewed:** 2026-03-13
