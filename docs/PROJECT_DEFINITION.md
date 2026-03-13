# FDM Monster — Project Definition

**Project Name:** FDM Monster  
**Version:** 0.1.0 (active development)  
**Status:** Foundation & Infrastructure Phase  
**Last Updated:** 2026-03-13

## Executive Summary

FDM Monster is a server for centrally managing a farm of 3D printers across multiple hardware platforms (OctoPrint, Klipper/Moonraker, Prusa-Link, Bambu Lab LAN mode). This document defines the development strategy, architecture philosophy, and feature roadmap.

## Vision

Enable operators to manage 100+ printers from a single web interface, with features including:
- Unified printer control and monitoring
- Job queue management and batch printing
- File storage and library management
- Print history and analytics
- User authentication and role-based access

## Scope — Phase 1 (Current)

**Focus:** Infrastructure & APIs for robust file and job management

### Active Effort: Project Foundation (v0.1.0)

**Goals:**
1. Establish AI-assisted development workflow with change tracking
2. Define architecture and API standards
3. Plan feature roadmap (Efforts v0.2.0 through v0.6.0)

**Deliverables:**
- \`.cursorrules\` — AI development guidelines
- \`DEVELOPMENT.md\` — Change index and effort tracking
- \`docs/\` directory with architecture and feature designs
- This document (\`PROJECT_DEFINITION.md\`)

### Queued Efforts (v0.2.0 – v0.6.0)

| Version | Effort | Purpose |
|---------|--------|---------|
| **v0.2.0** | **SQLite Metadata Storage** | Migrate file metadata to queryable DB; create \`FileRecord\` entity |
| **v0.3.0** | **File Management CRUD API** | Paginate, filter, update, bulk-delete stored files |
| **v0.4.0** | **Multi-Plate 3MF Support** | Parse multi-plate 3MF; create jobs per plate |
| **v0.5.0** | **Moonraker Metadata Normalization** | Normalize server metadata → \`PrintJobMetadata\` |
| **v0.6.0** | **Thumbnail Format Handling** | Support QOI; convert between formats; unified API |

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | 18+ LTS |
| **Language** | TypeScript | 5.9.3 |
| **Framework** | Express.js | 4.22.1 |
| **DI Container** | Awilix | 12.1.1 |
| **Database** | SQLite (TypeORM) | 5.x |
| **Test Runner** | Jest | 29.7.0 |
| **Build Tool** | SWC | 1.15.18 |
| **Formatter/Linter** | Biome | Latest |

## Architecture Philosophy

### Core Principles

1. **Domain-Driven Design**
   - Entities represent core business concepts (\`Printer\`, \`PrintJob\`, \`FileRecord\`, \`Floor\`)
   - Services implement business logic; controllers expose via HTTP
   - Clear separation of concerns

2. **Dependency Injection**
   - All services injected via Awilix container
   - Enables testing, loose coupling, and late binding

3. **Transactional Integrity**
   - File uploads + analysis + metadata persistence = one transaction
   - Job state transitions are atomic (PRINTING → COMPLETED, never partial)

4. **API-First Design**
   - RESTful endpoints with clear semantics
   - Permission-based access control (roles + granular permissions)
   - Comprehensive error handling

5. **Self-Documenting Code**
   - Clear naming > comments
   - Type safety via TypeScript
   - Markdown documentation for non-obvious decisions

### Directory Structure

\`\`\`
src/
├── controllers/           # HTTP request handlers
├── services/              # Business logic
│   ├── orm/               # Database services (repositories)
│   ├── authentication/    # Auth & sessions
│   ├── moonraker/         # Moonraker API client
│   ├── bambu/             # Bambu Lab API client
│   ├── octoprint/         # OctoPrint API client
│   ├── prusa-link/        # Prusa-Link API client
│   └── core/              # Cross-cutting services
├── entities/              # TypeORM entity definitions
├── middleware/            # Express middleware
├── utils/                 # Utility functions
│   ├── parsers/           # GCode, BGCode, 3MF parsers
│   └── cache/             # In-memory caches
├── state/                 # In-memory stores (sockets, caches)
├── migrations/            # TypeORM migrations
├── handlers/              # Logging, validation
├── constants/             # Enums, constants
└── exceptions/            # Typed exceptions

test/                      # Jest tests (mirrors src/)
docs/                      # Feature & architecture docs
  ├── architecture/        # ADRs, system design
  ├── api/                 # API specifications
  ├── features/            # Feature proposals
  └── guides/              # User guides, tutorials
\`\`\`

## Data Model — Key Entities

### Printer
- Represents a physical 3D printer instance
- Fields: name, type (OctoPrint, Moonraker, Prusa-Link, Bambu), connection details
- Relations: many PrintJobs, many CameraStreams

### PrintJob
- Represents a print job lifecycle (upload → print → completion)
- Fields: status (PENDING, QUEUED, PRINTING, COMPLETED, FAILED), progress, metadata
- Relations: one Printer, one FileRecord (via fileStorageId)
- State machine: strict transitions (e.g., only PRINTING → COMPLETED or FAILED)

### FileRecord (v0.2.0+)
- Represents a stored file and its metadata
- Fields: fileStorageId (UUID), fileHash (SHA256), originalFileName, fileFormat, metadata JSON
- Relations: many PrintJobs (reference via fileStorageId)
- Indices: fileHash (deduplication), originalFileName (search)

### Floor
- Represents a physical location/room with printers arranged on a grid
- Fields: name, rows, columns
- Relations: many FloorPositions, many Printers (via FloorPosition)

### User, Role, RefreshToken
- Authentication and authorization
- Roles: Admin, Operator, Viewer
- Permissions: granular controls per resource

## API Organization

### Current Endpoints

| Prefix | Purpose | Status |
|--------|---------|--------|
| \`/api/printer\` | Printer management | Stable |
| \`/api/printer-files\` | Printer file browser & upload | Stable |
| \`/api/print-jobs\` | Job lifecycle tracking | Stable |
| \`/api/file-storage\` | File storage & retrieval | Planned enhancement (v0.3.0) |
| \`/api/floor\` | Floor/grid management | Stable |
| \`/api/user\` | User management | Stable |
| \`/api/auth\` | Authentication | Stable |

### Versioning Strategy

- **Major version bump (1.0.0):** Breaking API changes or significant architecture shift
- **Minor version bump (0.X.0):** New features (non-breaking)
- **Patch version bump (0.0.X):** Bug fixes, documentation updates
- **Pre-release suffix:** \`-phase-N\` during active development; dropped when stable

## Feature Roadmap

### v0.1.0 (Current)
- ✓ AI development rules & change tracking
- ✓ Project definition & architecture docs
- [ ] Handoff to feature development

### v0.2.0 (SQLite Metadata Storage)
- [ ] Phase 1: FileRecord entity + migration
- [ ] Phase 2: Service implementation
- [ ] Phase 3: Data migration from JSON sidecars
- [ ] Phase 4: Full test coverage

**Effort size:** ~2-3 weeks (4 phases)

### v0.3.0 (File CRUD API)
- [ ] Permission constants
- [ ] Pagination & filtering on list endpoint
- [ ] PATCH for metadata update
- [ ] Bulk delete & bulk analyze
- [ ] Full test coverage

**Effort size:** ~2 weeks (4 phases)

### v0.4.0 (Multi-Plate 3MF Support)
- [ ] Wire \`analyzeMultiPlate3MF()\` into upload flow
- [ ] Create one job per plate
- [ ] Handle thumbnails per plate
- [ ] API representation of multi-plate jobs

**Effort size:** ~2 weeks (3 phases)

### v0.5.0 (Moonraker Metadata Normalization)
- [ ] Mapper: \`ServerFileMetadataDto\` → \`PrintJobMetadata\`
- [ ] Integration with metadata storage
- [ ] Full test coverage

**Effort size:** ~1 week (2 phases)

### v0.6.0 (Thumbnail Format Handling)
- [ ] QOI format conversion (to PNG)
- [ ] Unified thumbnail API
- [ ] Format-agnostic retrieval

**Effort size:** ~1 week (2 phases)

---

## Success Criteria

### Effort-Level
- ✓ All phases complete and tested
- ✓ Changes indexed in \`DEVELOPMENT.md\`
- ✓ API documentation updated
- ✓ Test coverage ≥ 80% for new code

### Phase-Level
- ✓ Deliverables complete
- ✓ Code passes linting (\`yarn biome check\`)
- ✓ User confirms before moving to next phase
- ✓ Changes logged to \`DEVELOPMENT.md\`

### Project-Level (Post-v0.6.0)
- ✓ File storage fully queryable and transactional
- ✓ API complete for file management (CRUD + bulk)
- ✓ Multi-plate and multi-format support robust
- ✓ Metadata normalized across sources
- ✓ ≥ 80% test coverage project-wide

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| JSON sidecar migration data loss | Low | High | Backup before migration; dual-read period |
| Performance regression on large file libraries | Medium | Medium | Add indices; benchmark before/after |
| Breaking API changes mid-effort | Low | High | Design upfront; use feature flags if needed |
| Parser bugs (GCode/BGCode/3MF) | Medium | Low | Existing parsers; add test cases incrementally |

## Open Questions

1. Should \`FileRecord\` be a renamed, refactored \`PrintJob\`, or a separate entity?
2. Thumbnail storage: filesystem (current) vs. BLOB in DB?
3. Multi-plate 3MF: one job per plate or one job with sub-jobs?
4. Moonraker metadata: should it override local analysis, or supplement?
5. Deprecation timeline for JSON sidecars?

## Related Documents

- **[.cursorrules](../.cursorrules)** — AI development rules
- **[DEVELOPMENT.md](../DEVELOPMENT.md)** — Change index & progress
- **[docs/architecture/file-storage.md](./architecture/file-storage.md)** — Storage architecture
- **[docs/features/](./features/)** — Feature proposals
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** — Human contributor guidelines

## Feedback & Iteration

This document is a living roadmap. As efforts progress, refine the roadmap based on:
- Technical learnings
- Scope changes
- Priority shifts

Update this file at the start of each major effort (v0.X.0).

---

**Last reviewed:** 2026-03-13  
**Next review:** End of v0.2.0 (SQLite effort)
