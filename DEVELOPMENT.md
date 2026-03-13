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

### Effort: Project Foundation & Infrastructure (v0.1.0)

**Status:** In Progress  
**Phase:** 1 of 3 — Setup, Planning & File Schema Definition  
**Started:** 2026-03-13  
**Current Phase Completion:** --

#### Phase 1.1 — File Storage Schema Planning (Current)

**Objective:** Define Phase 1 scope: discrete FileRecord table for file-storage.service.ts CRUD operations.

**Requirements (Validated ✅)**
1. Define file lookup table for CRUD support in Files API only
2. Schema fields:
   - Primary Key: Integer, auto-increment, NOT NULL, UNIQUE
   - Parent Key: Integer (FK), nullable, non-unique, allows hierarchy
   - Type: Enum {`dir`, `gcode`, `bgcode`, `3mf`}
   - Name: String, NOT NULL
   - File GUID: UUID string, UNIQUE, indexed
   - Metadata: Long JSON text, nullable
3. Root directory (pk=0): `(0, 0, 'dir', '/', NULL, NULL)`
4. Table scope: **file-storage.service.ts functions only**
5. Printer functions: **No changes**

**Deliverables (Planned)**
- \`src/entities/file-record.entity.ts\` — FileRecord TypeORM entity
- \`src/migrations/TIMESTAMP-CreateFileRecordTable.ts\` — Database migration
- \`docs/features/file-storage-phase-1.md\` — Design document
- \`src/services/file-storage.service.ts\` — Enhanced with CRUD methods (list, get, create, update, delete)
- Phase 1 test suite: \`test/services/file-storage.service.test.ts\`

**Next Steps**
- Phase 1.2: Entity & migration implementation
- Phase 1.3: Service layer CRUD methods
- Phase 1.4: Integration tests & root directory seed

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
| Total Efforts (All Time) | 1 (active) |
| Closed Efforts | 0 |
| Active Phases | 1 |
| Files Created (YTD) | 2 |
| Files Modified (YTD) | 0 |

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
