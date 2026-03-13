# File Management CRUD API — Feature Proposal

**Category:** Feature  
**Status:** Draft  
**Version:** 1.0  
**Last Updated:** 2026-03-13

## Overview

Enhance the \`FileStorageController\` API to provide complete CRUD operations with pagination, filtering, and permission controls.

## Current State

**Existing endpoints:**
- \`GET /api/file-storage\` — List all files (no pagination)
- \`GET /api/file-storage/:id\` — Get file metadata
- \`POST /api/file-storage/upload\` — Upload single file
- \`POST /api/file-storage/:id/analyze\` — Re-analyze file
- \`GET /api/file-storage/:id/thumbnail/:index\` — Get thumbnail by index
- \`DELETE /api/file-storage/:id\` — Delete file

**Gaps:**
- No pagination on list endpoint
- No bulk operations (delete, analyze)
- No metadata update (rename, add tags)
- No filtering (by format, date range, size)
- No permission constants (\`PERMS.FileStorage.*\`)

## Specification

### New Permission Constants

Add to \`src/constants/authorization.constants.ts\`:

\`\`\`typescript
export const PERMS = {
  // ... existing PERMS ...
  FileStorage: {
    List: "fileStorage.list",
    Get: "fileStorage.get",
    Upload: "fileStorage.upload",
    Delete: "fileStorage.delete",
    Update: "fileStorage.update",
    Analyze: "fileStorage.analyze",
  },
};
\`\`\`

### Enhanced Endpoints

| Method | Path | Purpose | Permission |
|--------|------|---------|-----------|
| GET | \`/api/file-storage\` | List files (paginated) | \`FileStorage.List\` |
| GET | \`/api/file-storage/:id\` | Get file metadata | \`FileStorage.Get\` |
| POST | \`/api/file-storage\` | Upload file | \`FileStorage.Upload\` |
| PATCH | \`/api/file-storage/:id\` | Update file metadata | \`FileStorage.Update\` |
| DELETE | \`/api/file-storage/:id\` | Delete file | \`FileStorage.Delete\` |
| POST | \`/api/file-storage/:id/analyze\` | Re-analyze file | \`FileStorage.Analyze\` |
| POST | \`/api/file-storage/bulk/delete\` | Bulk delete files | \`FileStorage.Delete\` |
| POST | \`/api/file-storage/bulk/analyze\` | Bulk re-analyze | \`FileStorage.Analyze\` |
| GET | \`/api/file-storage/:id/thumbnail/:index\` | Get thumbnail | \`FileStorage.Get\` |

### Example: List with Pagination & Filtering

**Request:**
\`\`\`http
GET /api/file-storage?page=1&pageSize=20&format=gcode&sortBy=createdAt&sortOrder=DESC
\`\`\`

**Response:**
\`\`\`json
{
  "items": [
    {
      "id": "abc123",
      "fileName": "model.gcode",
      "fileFormat": "gcode",
      "fileSize": 2048576,
      "fileHash": "sha256...",
      "createdAt": "2026-03-13T10:30:00Z",
      "thumbnailCount": 1
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 150,
  "totalPages": 8
}
\`\`\`

### Example: Update Metadata (Rename)

**Request:**
\`\`\`http
PATCH /api/file-storage/abc123
Content-Type: application/json

{
  "originalFileName": "model-v2.gcode"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "abc123",
  "fileName": "model-v2.gcode",
  "message": "File metadata updated"
}
\`\`\`

### Example: Bulk Delete

**Request:**
\`\`\`http
POST /api/file-storage/bulk/delete
Content-Type: application/json

{
  "fileIds": ["id1", "id2", "id3"],
  "deleteOrphanedFiles": true
}
\`\`\`

**Response:**
\`\`\`json
{
  "deleted": 3,
  "filesDeleted": 2,
  "filesStillInUse": 1,
  "errors": []
}
\`\`\`

## Implementation Plan

### Phase 1: Permission Constants & Schema
- Add \`PERMS.FileStorage.*\` to authorization constants
- Document required database schema (with \`FileRecord\` entity)

### Phase 2: Controller Enhancement
- Add \`permission()\` middleware to all endpoints
- Implement pagination (\`page\`, \`pageSize\`)
- Implement filtering (\`format\`, \`startDate\`, \`endDate\`, \`minSize\`, \`maxSize\`)
- Implement sorting (\`sortBy\`, \`sortOrder\`)
- Implement \`PATCH\` for metadata update (rename)

### Phase 3: Service Layer
- Add query builder methods to \`FileRecordService\`
- Add bulk operations to \`FileStorageService\`

### Phase 4: Testing
- API integration tests for all endpoints
- Permission/authorization tests
- Edge cases: empty list, invalid pagination, orphaned files

## Related Documents

- [\`../architecture/file-storage.md\`](../architecture/file-storage.md) — Architecture
- [\`sqlite-metadata-storage.md\`](./sqlite-metadata-storage.md) — FileRecord prerequisite
- [\`../api/file-storage-api.md\`](../api/file-storage-api.md) — Detailed API spec

## Open Questions

- Should \`PATCH\` support batch updates (multiple files)?
- Audit trail: track who uploaded/deleted files?
- Rate limiting on bulk operations?
