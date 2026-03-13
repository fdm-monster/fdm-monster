# File Storage Subsystem Architecture

**Category:** Architecture  
**Status:** In Review  
**Version:** 1.0  
**Last Updated:** 2026-03-13

## Overview

FDM Monster's file storage subsystem manages persistence of 3D printer files (GCode, BGCode, 3MF) and associated metadata (thumbnails, analysis results). This document outlines the current architecture and planned improvements.

## Current State

### Components

1. **FileStorageService** (\`src/services/file-storage.service.ts\`)
   - Handles file I/O: save, retrieve, delete
   - Manages JSON sidecar files for metadata (\`.json\` alongside \`.gcode\`, \`.3mf\`, \`.bgcode\`)
   - Directory-based organization: \`media/print-files/{gcode,3mf,bgcode}/\`
   - Thumbnail storage in \`_thumbnails/\` subdirectories

2. **FileAnalysisService** (\`src/services/file-analysis.service.ts\`)
   - Parses GCode, BGCode, 3MF files
   - Extracts metadata: print time, filament usage, layers, thumbnails
   - Delegates to format-specific parsers

3. **PrintJob Entity** (\`src/entities/print-job.entity.ts\`)
   - TypeORM entity tracking job lifecycle (PENDING → PRINTING → COMPLETED)
   - Stores reference to file storage via \`fileStorageId\` (string UUID)
   - Contains \`metadata\` JSON column (duplicate of JSON sidecar)
   - Tracks \`fileHash\` (SHA256) for deduplication

### Issues

| Issue | Impact | Root Cause |
|-------|--------|-----------|
| Metadata in two places | Data consistency risk | JSON sidecars + TypeORM JSON column both exist |
| No queryable metadata indices | O(n) on duplicate searches | Full directory scan in \`findDuplicateByOriginalFileName()\` |
| No dedicated file record entity | Weak domain model | \`PrintJob\` mixes job lifecycle with file identity |
| Thumbnail references not indexed | Orphaned thumbnails possible | Thumbnail paths only stored in JSON |
| QOI format silently rejected | Poor UX | API returns 404 instead of converting |

## Planned Improvements (v0.2.0+)

### Phase 1: FileRecord Entity
- Create new \`FileRecord\` entity in TypeORM
- Fields: \`id\`, \`fileHash\`, \`originalFileName\`, \`fileStorageId\`, \`fileFormat\`, \`fileSize\`, \`createdAt\`, \`updatedAt\`
- Add indices on \`fileHash\` and \`originalFileName\`
- Migrate metadata storage from JSON sidecars to \`metadata\` JSON column on \`FileRecord\`

### Phase 2: Service Layer
- Create \`FileRecordService\` for CRUD operations
- Update \`FileStorageService\` to use \`FileRecord\` for persistence
- Add transactional operations for upload+analyze+save

### Phase 3: Migration
- Data migration script: read JSON sidecars → create \`FileRecord\` rows
- Deprecate JSON sidecar reads
- Remove sidecar fallback code

### Phase 4: API Enhancement
- Paginated listing
- Bulk operations
- Metadata update endpoints (rename, retag)

## Related Documents

- [\`../features/sqlite-metadata-storage.md\`](../features/sqlite-metadata-storage.md) — Detailed migration proposal
- [\`../api/file-storage-api.md\`](../api/file-storage-api.md) — API reference

## Open Questions

- Should \`FileRecord\` be a separate entity or a renamed extension of \`PrintJob\`?
- How to handle backward compatibility during migration (dual-read period)?
- Should thumbnails be stored in DB (BLOB) or filesystem?
