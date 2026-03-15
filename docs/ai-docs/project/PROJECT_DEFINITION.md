# FDM Monster — Project Definition

**Project Name:** FDM Monster
**Version:** 0.3.0 (active development)
**Status:** File Management Complete - Planning Next Phase
**Last Updated:** 2026-03-14

## Executive Summary

FDM Monster is a server for centrally managing a farm of 3D printers across multiple hardware platforms (OctoPrint, Klipper/Moonraker, Prusa-Link, Bambu Lab LAN mode). This document defines the development strategy, architecture philosophy, and feature roadmap.

## Vision

Enable operators to manage 100+ printers from a single web interface, with features including:
- Unified printer control and monitoring
- Job queue management and batch printing
- File storage and library management
- Print history and analytics
- User authentication and role-based access

## Development Status

**Focus:** Infrastructure & APIs for robust file and job management

### Completed Efforts

| Version | Effort | Status | Completion Date |
|---------|--------|--------|-----------------|
| **v0.1.0** | **Project Foundation** | ✅ Complete | 2026-03-13 |
| **v0.2.0** | **SQLite Metadata Storage** | ✅ Complete | 2026-03-13 |
| **v0.3.0** | **File Management CRUD API** | ✅ Complete | 2026-03-14 |

**v0.1.0 Deliverables:**
- ✓ AI-assisted development workflow with `.cursorrules`
- ✓ Change tracking via `DEVELOPMENT.md`
- ✓ Architecture documentation
- ✓ Feature roadmap planning

**v0.2.0 Deliverables:**
- ✓ FileRecord entity with TypeORM
- ✓ Database migration for FileRecord table
- ✓ Backfill task for existing files
- ✓ Root directory seed data

**v0.3.0 Deliverables:**
- ✓ Pagination, filtering, and sorting
- ✓ PATCH endpoint for file renaming
- ✓ Bulk delete and bulk analyze operations
- ✓ Backfill migration integration
- ✓ Self-healing orphaned record cleanup
- ✓ 63 tests (41 integration + 22 unit)

### Removed from Roadmap

The following items were evaluated and removed from scope:

| Version | Effort | Reason for Removal |
|---------|--------|-------------------|
| ~~**v0.4.0**~~ | ~~Multi-Plate 3MF Support~~ | Out of scope - not a current user need |
| ~~**v0.5.0**~~ | ~~Moonraker Metadata Normalization~~ | Out of scope - existing parsers sufficient |
| ~~**v0.6.0**~~ | ~~Thumbnail Format Handling (QOI)~~ | Out of scope - PNG/JPG support is adequate |

See `docs/features/file-storage-permissions-deferred.md` for detailed removal rationale.

### Next Priorities

**Status:** Planning phase - awaiting direction

**Options for next development effort:**
1. Permission-based access control for FileStorage endpoints
2. New feature development (TBD based on user needs)
3. Performance optimization and scaling
4. Frontend integration improvements

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

### Completed Efforts

#### v0.1.0 - Project Foundation ✅
**Completed:** 2026-03-13 | **Effort:** 1 week
- ✓ AI development rules & change tracking
- ✓ Project definition & architecture docs
- ✓ Handoff to feature development

#### v0.2.0 - SQLite Metadata Storage ✅
**Completed:** 2026-03-13 | **Effort:** 2 weeks (4 phases)
- ✓ Phase 1: FileRecord entity + migration
- ✓ Phase 2: Service implementation
- ✓ Phase 3: Integration with upload/delete/list flows
- ✓ Phase 4: Full test coverage
- ✓ Backfill task for existing files

#### v0.3.0 - File Management CRUD API ✅
**Completed:** 2026-03-14 | **Effort:** 2 weeks (4 phases + bugfixes)
- ✓ Phase 1: Integration testing foundation
- ✓ Phase 2: FileRecord integration
- ✓ Phase 3: Pagination, filtering, sorting, PATCH endpoint
- ✓ Phase 4: Bulk delete & bulk analyze
- ✓ Backfill migration integration
- ✓ Self-healing orphaned record cleanup
- ✓ 63 tests (41 integration + 22 unit)

### Future Considerations

The following items may be reconsidered based on user demand:

**Permission-Based Access Control**
- Add role-based permissions to FileStorage endpoints
- Follow existing PrinterFilesController pattern
- Estimated effort: 6-10 hours

**Multi-Plate 3MF Support** (Deferred)
- Parse multi-plate 3MF files
- Create separate jobs per plate
- Estimated effort: 2 weeks

**Advanced Metadata Features** (Deferred)
- Moonraker metadata normalization
- Additional thumbnail format support (QOI)
- Estimated effort: 1-2 weeks combined

---

## Success Criteria

### Effort-Level (All Met ✅)
- ✓ All phases complete and tested
- ✓ Changes indexed in `DEVELOPMENT.md`
- ✓ API documentation updated
- ✓ Test coverage ≥ 80% for new code

### Phase-Level (All Met ✅)
- ✓ Deliverables complete
- ✓ Code passes linting (`yarn biome check`)
- ✓ User confirms before moving to next phase
- ✓ Changes logged to `DEVELOPMENT.md`

### Project-Level (v0.3.0 Complete ✅)
- ✓ File storage fully queryable and transactional (FileRecord entity)
- ✓ API complete for file management (CRUD + bulk operations)
- ✓ Self-healing infrastructure (orphaned record cleanup)
- ✓ Migration strategy for existing deployments (backfill)
- ✓ 80%+ test coverage achieved (63 tests total)

## Risk Register

| Risk | Likelihood | Impact | Status | Mitigation |
|------|-----------|--------|--------|-----------|
| JSON sidecar migration data loss | Low | High | ✅ Mitigated | Backfill migration maintains JSON sidecars; idempotent |
| Performance regression on large file libraries | Medium | Medium | ⚠️ Monitor | Indices added; self-healing cleanup may impact large datasets |
| Breaking API changes mid-effort | Low | High | ✅ Avoided | Backward-compatible design; optional pagination parameter |
| Parser bugs (GCode/BGCode/3MF) | Medium | Low | ✅ Stable | Existing parsers working; comprehensive test coverage |
| Orphaned records accumulating | Low | Medium | ✅ Resolved | Self-healing cleanup in listAllFiles() |

## Open Questions

~~1. Should `FileRecord` be a renamed, refactored `PrintJob`, or a separate entity?~~
   - ✅ Resolved: Separate entity; PrintJob references FileRecord via fileStorageId

~~2. Thumbnail storage: filesystem (current) vs. BLOB in DB?~~
   - ✅ Resolved: Filesystem; maintains current architecture

~~3. Multi-plate 3MF: one job per plate or one job with sub-jobs?~~
   - ⏸️ Deferred: Out of current scope

~~4. Moonraker metadata: should it override local analysis, or supplement?~~
   - ⏸️ Deferred: Out of current scope

~~5. Deprecation timeline for JSON sidecars?~~
   - ✅ Resolved: Maintained alongside FileRecords for backward compatibility

### Current Open Questions

1. **Performance optimization:** Should self-healing cleanup be opt-in for very large file libraries (1000+ files)?
2. **Next development priority:** What feature/improvement should follow v0.3.0?
3. **Permission system:** Should FileStorage endpoints adopt the same permission model as PrinterFiles?

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

**Last reviewed:** 2026-03-14
**Next review:** When v0.4.0 planning begins

## Changelog

**2026-03-14:**
- Updated status to v0.3.0 complete
- Marked v0.1.0, v0.2.0, v0.3.0 as complete with deliverables
- Moved v0.4.0, v0.5.0, v0.6.0 to "Removed from Roadmap" section
- Updated success criteria to reflect completion
- Resolved open questions related to completed work
- Updated risk register with current status
