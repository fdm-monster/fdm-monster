# File Manager API Enhancements — v0.4.0

**Category:** Feature
**Status:** Planning
**Version:** v0.4.0
**Last Updated:** 2026-03-14

## Overview

Enhance the File Storage API to support frontend file manager UI capabilities including hierarchical folder navigation, drag-and-drop file relocation, directory-specific uploads, and multi-select batch operations.

## Motivation

**Context from Frontend Team:**

The FDM Monster Client (Next) Vue 3 application is implementing an enhanced `/Files` view with:
- List-style view with collapsible folders
- Drag & drop file relocation between directories
- Directory-specific upload targets
- Multi-select batch operations (move, delete)
- Directory thumbnails (composite previews)

**Current Backend Limitations:**

| Frontend Need | Current API | Gap |
|--------------|-------------|-----|
| Display folder contents | `GET /file-storage` lists all files | ❌ No `parentId` filter |
| Upload to folder | `POST /upload` saves to root | ❌ No `parentId` parameter |
| Move files between folders | No endpoint | ❌ Missing move operation |
| Create directories | FileRecord entity supports it | ❌ Not exposed via API |
| Batch move files | Only bulk delete/analyze | ❌ No bulk move |
| Navigate folder tree | No tree endpoint | ❌ No hierarchical data structure |
| Breadcrumb paths | No path endpoint | ❌ No ancestor traversal |

**Database Foundation (Already Complete):**

The `FileRecord` entity (created in v0.2.0) fully supports hierarchical file systems:
- `parentId: number | null` — Parent directory reference
- `type: "dir" | "gcode" | "bgcode" | "3mf"` — Directories are first-class entities
- `fileGuid: string` (indexed) — Fast lookups
- Root directory seeded: `id=0, parentId=0, type="dir", name="/"`

**Scope:** This effort exposes existing database capabilities via new API endpoints. No schema changes required.

---

## Specification

### Phase 1: Directory Filtering & Navigation (Priority 1)

#### Endpoint 1.1: List Files by Parent Directory

**Request:**
```http
GET /api/v2/file-storage?parentId=123&page=1&pageSize=50
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `parentId` | number (optional) | Filter by parent directory ID (default: list all) |
| `page`, `pageSize`, `type`, `sortBy`, `sortOrder` | — | Existing parameters |

**Response (200 OK):**
```json
{
  "files": [
    {
      "fileStorageId": "abc-123",
      "fileName": "benchy.gcode",
      "fileFormat": "gcode",
      "parentId": 123,
      "type": "gcode",
      "fileSize": 2048576,
      "createdAt": "2026-03-14T10:00:00Z",
      "thumbnails": [...],
      "metadata": {...}
    },
    {
      "fileStorageId": "00000000-0000-0000-0000-000000000456",
      "fileName": "prototypes",
      "parentId": 123,
      "type": "dir",
      "createdAt": "2026-03-10T08:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 50,
  "totalCount": 42,
  "totalPages": 1
}
```

**Changes Required:**
- `FileStorageController.listFiles()`: Add `parentId` query param
- `FileStorageService.listFileRecords()`: Filter by `parentId` when provided
- Response includes both files and directories (type="dir")

**Tests:**
- List root directory (`parentId=0`)
- List subdirectory contents
- List empty directory (returns empty array)
- List non-existent directory (returns 404)

---

#### Endpoint 1.2: Get Breadcrumb Path

**Request:**
```http
GET /api/v2/file-storage/:id/path
```

**Response (200 OK):**
```json
{
  "path": [
    { "id": 0, "name": "/", "type": "dir" },
    { "id": 5, "name": "models", "type": "dir" },
    { "id": 23, "name": "prototypes", "type": "dir" }
  ],
  "targetId": 23,
  "targetName": "prototypes"
}
```

**Use Case:** Display breadcrumb navigation: `/ > models > prototypes`

**Algorithm:**
```typescript
async getPath(fileRecordId: number): Promise<FileRecord[]> {
  const path: FileRecord[] = [];
  let current = await this.getFileRecordById(fileRecordId);

  while (current && current.id !== 0) {
    path.unshift(current);
    if (current.parentId === null || current.parentId === 0) break;
    current = await this.getFileRecordById(current.parentId);
  }

  // Add root if not already included
  if (path[0]?.id !== 0) {
    const root = await this.getFileRecordById(0);
    if (root) path.unshift(root);
  }

  return path;
}
```

**Tests:**
- Get path for root directory (returns `[{id: 0, name: "/"}]`)
- Get path for nested file (returns full ancestry)
- Get path for non-existent ID (returns 404)

---

### Phase 2: File Upload to Directories (Priority 1)

#### Endpoint 2.1: Upload File with Target Directory

**Request:**
```http
POST /api/v2/file-storage/upload
Content-Type: multipart/form-data

file: <file>
parentId: 123
```

**Form Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | The file to upload (`.gcode`, `.3mf`, `.bgcode`) |
| `parentId` | number (optional) | Target directory ID (default: 0 = root) |

**Response (200 OK):**
```json
{
  "message": "File uploaded successfully",
  "fileStorageId": "abc-123",
  "fileName": "benchy.gcode",
  "parentId": 123,
  "fileSize": 2048576,
  "fileHash": "sha256...",
  "metadata": {...},
  "thumbnailCount": 2
}
```

**Validation:**
- If `parentId` provided:
  - Parent record must exist
  - Parent record must be type `"dir"`
  - Return 400 if parent not found or not a directory
- If `parentId` omitted, default to `0` (root)

**Changes Required:**
- `FileStorageController.uploadFile()`: Parse `parentId` from form data
- `FileStorageService.createFileRecord()`: Accept `parentId` in data object
- Add validation helper: `validateParentDirectory(parentId)`

**Tests:**
- Upload to root (no `parentId`)
- Upload to existing directory
- Upload to non-existent directory (400 error)
- Upload to file instead of directory (400 error)

---

### Phase 3: File Relocation (Priority 1)

#### Endpoint 3.1: Move File or Directory

**Request:**
```http
POST /api/v2/file-storage/:fileStorageId/move
Content-Type: application/json

{
  "parentId": 456
}
```

**Response (200 OK):**
```json
{
  "message": "File moved successfully",
  "fileStorageId": "abc-123",
  "oldParentId": 123,
  "newParentId": 456,
  "path": [
    { "id": 0, "name": "/" },
    { "id": 456, "name": "final-models" }
  ]
}
```

**Validation:**
- Target `parentId` must exist and be type `"dir"`
- Cannot move directory into itself (circular reference check)
- Cannot move directory into its own descendant (prevents cycles)
- Cannot move root directory (`id=0`)

**Circular Reference Detection:**
```typescript
async validateMove(sourceId: number, targetParentId: number): Promise<void> {
  // Cannot move into self
  if (sourceId === targetParentId) {
    throw new BadRequestException("Cannot move directory into itself");
  }

  // Check if target is a descendant of source
  const targetPath = await this.getPath(targetParentId);
  const isDescendant = targetPath.some(record => record.id === sourceId);

  if (isDescendant) {
    throw new BadRequestException(
      "Cannot move directory into its own subdirectory (circular reference)"
    );
  }
}
```

**Changes Required:**
- New controller method: `moveFile(req, res)`
- New service method: `moveFileRecord(fileStorageId, newParentId)`
- New validation method: `validateMove(sourceId, targetParentId)`

**Tests:**
- Move file between directories
- Move directory with children
- Move to root directory (`parentId=0`)
- Attempt move to self (400 error)
- Attempt circular move (400 error)
- Move non-existent file (404 error)
- Move to non-existent parent (400 error)
- Move to file instead of directory (400 error)

---

### Phase 4: Bulk Operations & Tree View (Priority 2)

#### Endpoint 4.1: Bulk Move Files

**Request:**
```http
POST /api/v2/file-storage/bulk/move
Content-Type: application/json

{
  "fileIds": ["abc-123", "def-456", "ghi-789"],
  "parentId": 999
}
```

**Response (200 OK):**
```json
{
  "moved": 2,
  "failed": 1,
  "errors": [
    {
      "fileId": "ghi-789",
      "error": "Cannot move directory into its own subdirectory"
    }
  ]
}
```

**Validation:**
- Max 100 files per request
- `parentId` must exist and be type `"dir"`
- Individual files validated (circular checks, existence)
- Partial success allowed (continue on individual failures)

**Tests:**
- Move multiple files successfully
- Move with partial failures
- Exceed 100 file limit (400 error)
- Move to non-existent parent (400 error)

---

#### Endpoint 4.2: Create Directory

**Request:**
```http
POST /api/v2/file-storage/directories
Content-Type: application/json

{
  "name": "prototypes",
  "parentId": 123
}
```

**Response (201 Created):**
```json
{
  "message": "Directory created successfully",
  "id": 456,
  "fileGuid": "abc-123-...",
  "name": "prototypes",
  "parentId": 123,
  "type": "dir",
  "createdAt": "2026-03-14T10:00:00Z"
}
```

**Validation:**
- `name` required, non-empty, valid characters (`/^\w[\w\s\-\.]*$/`)
- `parentId` required, must exist and be type `"dir"`
- Check for duplicate name in same parent (optional: allow or prevent)

**Tests:**
- Create directory in root
- Create nested directory
- Create with duplicate name (behavior TBD)
- Create in non-existent parent (400 error)

---

#### Endpoint 4.3: Get Directory Tree

**Request:**
```http
GET /api/v2/file-storage/tree?maxDepth=3&filesOnly=false
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxDepth` | number | 10 | Maximum recursion depth |
| `filesOnly` | boolean | false | If true, exclude empty directories |

**Response (200 OK):**
```json
{
  "tree": {
    "id": 0,
    "name": "/",
    "type": "dir",
    "children": [
      {
        "id": 5,
        "name": "models",
        "type": "dir",
        "fileCount": 12,
        "children": [
          {
            "id": 23,
            "name": "prototypes",
            "type": "dir",
            "fileCount": 3,
            "children": []
          },
          {
            "id": 42,
            "name": "benchy.gcode",
            "type": "gcode",
            "fileStorageId": "abc-123",
            "fileSize": 2048576
          }
        ]
      }
    ]
  },
  "totalFiles": 15,
  "totalDirectories": 3,
  "maxDepthReached": false
}
```

**Algorithm:**
```typescript
async buildTree(parentId: number, currentDepth: number, maxDepth: number): Promise<TreeNode> {
  if (currentDepth >= maxDepth) {
    return null; // Depth limit reached
  }

  const record = await this.getFileRecordById(parentId);
  const children = await this.listFileRecords(parentId);

  const node: TreeNode = {
    id: record.id,
    name: record.name,
    type: record.type,
    children: []
  };

  if (record.type === 'dir') {
    for (const child of children) {
      if (child.type === 'dir') {
        const childTree = await this.buildTree(child.id, currentDepth + 1, maxDepth);
        if (childTree) node.children.push(childTree);
      } else {
        node.children.push({
          id: child.id,
          name: child.name,
          type: child.type,
          fileStorageId: child.fileGuid
        });
      }
    }
  }

  return node;
}
```

**Performance Considerations:**
- Limit `maxDepth` to prevent excessive recursion (default 10, max 20)
- Cache tree structure (5-minute TTL)
- Return file count per directory (for UI badges)

**Tests:**
- Get full tree from root
- Get tree with depth limit
- Get tree with `filesOnly=true`
- Large tree performance (100+ files)

---

## API Summary

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `GET /file-storage?parentId={id}` | GET | List directory contents | P1 |
| `GET /file-storage/:id/path` | GET | Get breadcrumb trail | P1 |
| `POST /file-storage/upload` (add `parentId`) | POST | Upload to directory | P1 |
| `POST /file-storage/:id/move` | POST | Move file/directory | P1 |
| `POST /file-storage/bulk/move` | POST | Bulk move operation | P2 |
| `POST /file-storage/directories` | POST | Create directory | P2 |
| `GET /file-storage/tree` | GET | Recursive tree structure | P2 |

---

## Database Schema Impact

**No schema changes required.** All functionality leverages existing `FileRecord` columns:
- `parentId` — Already supports hierarchy
- `type: "dir"` — Already supports directories
- `fileGuid` — Already indexed for fast lookups

**Service Layer Changes:**
- Add helper methods to `FileStorageService`:
  - `getPath(fileRecordId): Promise<FileRecord[]>`
  - `validateMove(sourceId, targetParentId): Promise<void>`
  - `buildTree(parentId, depth, maxDepth): Promise<TreeNode>`
  - `validateParentDirectory(parentId): Promise<void>`

---

## Frontend Integration

### Use Cases Enabled

1. **Folder Navigation:**
   ```typescript
   // Display folder contents
   const response = await fetch(`/api/v2/file-storage?parentId=${folderId}`);
   const { files } = await response.json();
   ```

2. **Breadcrumb Trail:**
   ```typescript
   // Show path: / > models > prototypes
   const { path } = await fetch(`/api/v2/file-storage/${folderId}/path`).then(r => r.json());
   ```

3. **Upload to Folder:**
   ```typescript
   const formData = new FormData();
   formData.append('file', fileBlob);
   formData.append('parentId', folderId);
   await fetch('/api/v2/file-storage/upload', { method: 'POST', body: formData });
   ```

4. **Drag & Drop Move:**
   ```typescript
   await fetch(`/api/v2/file-storage/${fileId}/move`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ parentId: targetFolderId })
   });
   ```

5. **Batch Move:**
   ```typescript
   await fetch('/api/v2/file-storage/bulk/move', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ fileIds: selectedIds, parentId: targetFolderId })
   });
   ```

6. **Create Folder:**
   ```typescript
   await fetch('/api/v2/file-storage/directories', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ name: 'New Folder', parentId: currentFolderId })
   });
   ```

7. **Tree Sidebar:**
   ```typescript
   const { tree } = await fetch('/api/v2/file-storage/tree?maxDepth=3').then(r => r.json());
   // Render collapsible tree UI
   ```

---

## Testing Requirements

### Integration Tests (36 total)

**Phase 1 (8 tests):**
- List files by `parentId` (root, subdirectory, empty, non-existent)
- Get breadcrumb path (root, nested, non-existent, file vs directory)

**Phase 2 (6 tests):**
- Upload to root, directory, non-existent parent, file instead of directory
- Validate `parentId` parsing from multipart form

**Phase 3 (10 tests):**
- Move file between directories
- Move directory with children
- Move to root
- Circular move detection (self, descendant)
- Move non-existent file/parent
- Move to file instead of directory

**Phase 4 (12 tests):**
- Bulk move (success, partial failure, limit exceeded)
- Create directory (root, nested, duplicate name, invalid parent)
- Get tree (full, depth limit, filesOnly, performance)

**Coverage Requirement:** ≥80% per `.cursorrules` Rule 7

---

## Backward Compatibility

**All existing endpoints remain unchanged:**
- `GET /file-storage` — Still lists all files when `parentId` omitted
- `POST /upload` — Still uploads to root when `parentId` omitted
- All other endpoints unchanged

**Migration:** None required (database schema already supports hierarchy)

---

## Open Questions

1. **Directory Name Validation:**
   - Allow duplicate names in same parent?
   - Character restrictions? (suggest: `\w[\w\s\-\.]*` — alphanumeric, spaces, hyphens, dots)

2. **Delete Behavior:**
   - Should deleting a directory cascade to children?
   - Or require empty directory first?
   - (Suggest: Add `recursive=true` query param, default false)

3. **Directory Thumbnails:**
   - Generate composite thumbnails from folder contents? (4-image grid)
   - Defer to future effort or include in Phase 4?

4. **Move Performance:**
   - Batch move 100 files — acceptable latency?
   - Consider async job queue for large moves?

5. **Tree Caching:**
   - Cache tree structure in Redis/memory?
   - Invalidate on move/create/delete?

---

## Related Documents

- [`../api/file-storage-api.md`](../api/file-storage-api.md) — Current API reference (will be updated)
- [`../architecture/file-storage.md`](../architecture/file-storage.md) — Architecture overview
- [`file-storage-phase-1.md`](./file-storage-phase-1.md) — FileRecord entity implementation (v0.2.0)
- [`../ai-docs/project/FILE_MANAGER_API_RESUME.md`](../ai-docs/project/FILE_MANAGER_API_RESUME.md) — Implementation resume prompt

---

## Implementation Status

**Status:** Planning (not yet started)
**Next Step:** Review specification with team, then proceed to Phase 1 implementation
