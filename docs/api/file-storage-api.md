# File Storage API Reference

**Status:** Draft
**Version:** 2.0 (v0.4.0 enhancements)
**Last Updated:** 2026-03-15

## Overview

The File Storage API manages persistent storage of 3D printer files (GCode, BGCode, 3MF) and their metadata/thumbnails.

## Base URL

\`\`\`
/api/file-storage
\`\`\`

## Authentication

All endpoints require:
- Bearer token in \`Authorization\` header (JWT)
- User role: Admin or Operator
- Endpoint-specific permissions (see each endpoint)

## Endpoints

### List Files

**\`GET /api/file-storage\`**

List stored files with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| \`page\` | integer | 1 | Page number (1-indexed) |
| \`pageSize\` | integer | 20 | Items per page |
| \`parentId\` | integer | — | **NEW (v0.4.0)** Filter by parent directory ID |
| \`format\` | string | — | Filter by format: \`gcode\`, \`bgcode\`, \`3mf\` |
| \`startDate\` | ISO 8601 | — | Filter by creation date (inclusive) |
| \`endDate\` | ISO 8601 | — | Filter by creation date (inclusive) |
| \`minSize\` | integer | — | Filter by min file size (bytes) |
| \`maxSize\` | integer | — | Filter by max file size (bytes) |
| \`sortBy\` | string | \`createdAt\` | Sort field: \`fileName\`, \`fileSize\`, \`createdAt\`, \`fileHash\` |
| \`sortOrder\` | string | \`DESC\` | Sort order: \`ASC\`, \`DESC\` |

**Response (200 OK):**
\`\`\`json
{
  "items": [
    {
      "id": "abc123-def456",
      "fileName": "model.gcode",
      "fileFormat": "gcode",
      "fileSize": 2048576,
      "fileHash": "abc123def456...",
      "createdAt": "2026-03-13T10:30:00Z",
      "thumbnailCount": 1,
      "metadata": {
        "fileName": "model.gcode",
        "fileFormat": "gcode",
        "gcodePrintTimeSeconds": 3600,
        "filamentUsedGrams": 45.2
      }
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 150,
  "totalPages": 8
}
\`\`\`

**Errors:**
- \`401 Unauthorized\` — Missing or invalid token
- \`403 Forbidden\` — Insufficient permissions
- \`400 Bad Request\` — Invalid pagination or filter parameters

---

### Get File Metadata

**\`GET /api/file-storage/:id\`**

Retrieve metadata for a specific stored file.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| \`id\` | string | File storage ID (UUID) |

**Response (200 OK):**
\`\`\`json
{
  "id": "abc123-def456",
  "fileName": "model.gcode",
  "fileFormat": "gcode",
  "fileSize": 2048576,
  "fileHash": "abc123def456...",
  "createdAt": "2026-03-13T10:30:00Z",
  "thumbnails": [
    {
      "index": 0,
      "width": 256,
      "height": 256,
      "format": "png",
      "size": 8192
    }
  ],
  "metadata": {
    "fileName": "model.gcode",
    "fileFormat": "gcode",
    "gcodePrintTimeSeconds": 3600,
    "filamentUsedGrams": 45.2,
    "nozzleDiameterMm": 0.4,
    "layerHeight": 0.2,
    "totalLayers": 180
  }
}
\`\`\`

**Errors:**
- \`404 Not Found\` — File not found
- \`401 Unauthorized\`, \`403 Forbidden\` — Authentication/authorization

---

### Upload File

**\`POST /api/file-storage/upload\`** or **\`POST /api/file-storage\`**

Upload and analyze a new file with optional directory placement.

**Request:**
- Content-Type: \`multipart/form-data\`
- Fields:
  - \`file\` (required): File to upload (\`.gcode\`, \`.bgcode\`, \`.3mf\`)
  - \`parentId\` (optional): **NEW (v0.4.0 Phase 2)** Target directory ID (numeric)
  - \`filePath\` (optional): **NEW (v0.4.0 Phase 2.5)** Full file path for auto-creating directory hierarchy (string)
  - \`startPrint\` (optional): Start print immediately (true/false)

**Directory Placement Priority:**
1. **\`parentId\`** (highest priority) - If provided, file is placed in specified directory ID
2. **\`filePath\`** - If provided (and no \`parentId\`), path is parsed and directories auto-created
3. **Root directory** (default) - If neither provided, file is placed in root (ID=0)

**\`filePath\` Parameter Usage:**

The \`filePath\` parameter enables automatic directory creation from external APIs (OctoPrint, Moonraker, slicers) that send full file paths. When provided:
- Parses directory path from full file path
- Auto-creates missing directories in hierarchy
- Reuses existing directories (no duplicates)
- Supports both Unix (\`/\`) and Windows (\`\\\`) path separators
- Extracts filename and stores in correct parent directory

**Frontend Developer Notes:**
- **Use \`parentId\` for UI-driven uploads** - When user selects target folder from tree view
- **Use \`filePath\` for external integrations** - When receiving full paths from external APIs
- **Don't use both** - \`parentId\` takes precedence; \`filePath\` is ignored if \`parentId\` is set

**Examples:**

**Example 1: Upload to specific directory (UI-driven)**
\`\`\`bash
curl -X POST http://localhost:3000/api/file-storage/upload \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@model.gcode" \\
  -F "parentId=5"  # User selected "Projects" folder (ID=5)
\`\`\`
Result: File stored in directory ID=5

**Example 2: Auto-create directory hierarchy (external API)**
\`\`\`bash
curl -X POST http://localhost:3000/api/file-storage/upload \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@model.gcode" \\
  -F "filePath=projects/prototypes/part.gcode"  # Full path from slicer
\`\`\`
Result:
- Creates directory "projects" (if missing)
- Creates directory "prototypes" under "projects" (if missing)
- Stores "part.gcode" in "projects/prototypes"

**Example 3: Priority demonstration (parentId wins)**
\`\`\`bash
curl -X POST http://localhost:3000/api/file-storage/upload \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@model.gcode" \\
  -F "parentId=8" \\
  -F "filePath=ignored/path.gcode"  # This is ignored!
\`\`\`
Result: File stored in directory ID=8, no directories created from filePath

**Example 4: Upload to root (default)**
\`\`\`bash
curl -X POST http://localhost:3000/api/file-storage/upload \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@model.gcode"  # No parentId or filePath
\`\`\`
Result: File stored in root directory (ID=0)

**Response (200 OK):**
\`\`\`json
{
  "message": "File uploaded successfully",
  "fileStorageId": "abc123-def456",
  "fileName": "model.gcode",
  "fileSize": 2048576,
  "fileHash": "abc123def456...",
  "metadata": {
    "fileFormat": "gcode",
    "gcodePrintTimeSeconds": 3600,
    "filamentUsedGrams": 45.2
  },
  "thumbnailCount": 1
}
\`\`\`

**Errors:**
- \`400 Bad Request\` — No file, invalid format, file too large, invalid parentId, parent is not a directory, or failed to resolve filePath
- \`404 Not Found\` — Parent directory (from parentId) not found
- \`409 Conflict\` — File already exists (same name)
- \`500 Internal Server Error\` — Failed to create directories from filePath
- \`401 Unauthorized\`, \`403 Forbidden\` — Authentication/authorization

**Backward Compatibility:**
- Omitting both \`parentId\` and \`filePath\` defaults to root directory (0)
- Existing upload workflows continue to work unchanged

---

### Update File Metadata

**\`PATCH /api/file-storage/:id\`**

Update file metadata (e.g., rename file).

**Request:**
\`\`\`json
{
  "originalFileName": "model-v2.gcode",
  "tags": ["important", "final"]
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "id": "abc123-def456",
  "fileName": "model-v2.gcode",
  "message": "File metadata updated"
}
\`\`\`

**Errors:**
- \`404 Not Found\` — File not found
- \`409 Conflict\` — New filename already exists
- \`400 Bad Request\` — Invalid request body
- \`401 Unauthorized\`, \`403 Forbidden\` — Authentication/authorization

---

### Delete File

**\`DELETE /api/file-storage/:id\`**

Delete a stored file and its thumbnails.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| \`force\` | boolean | Force delete even if in use (default: false) |

**Response (200 OK):**
\`\`\`json
{
  "message": "File deleted successfully",
  "fileStorageId": "abc123-def456",
  "filesDeleted": 1,
  "remainingReferences": 0
}
\`\`\`

**Errors:**
- \`404 Not Found\` — File not found
- \`409 Conflict\` — File still in use by jobs (and \`force=false\`)
- \`500 Internal Server Error\` — Deletion failed
- \`401 Unauthorized\`, \`403 Forbidden\` — Authentication/authorization

---

### Get Thumbnail

**\`GET /api/file-storage/:id/thumbnail/:index\`**

Retrieve a specific thumbnail as base64 data URI.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| \`id\` | string | File storage ID (UUID) |
| \`index\` | integer | Thumbnail index (0-based) |

**Response (200 OK):**
\`\`\`json
{
  "thumbnailBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
\`\`\`

**Errors:**
- \`404 Not Found\` — File or thumbnail not found
- \`400 Bad Request\` — Invalid index
- \`401 Unauthorized\`, \`403 Forbidden\` — Authentication/authorization

---

### Re-analyze File

**\`POST /api/file-storage/:id/analyze\`**

Re-analyze an existing file to update metadata and thumbnails.

**Request:**
\`\`\`json
{}
\`\`\`

**Response (202 Accepted):**
\`\`\`json
{
  "message": "File analysis started",
  "fileStorageId": "abc123-def456",
  "status": "analyzing"
}
\`\`\`

**Response (200 OK) — if already analyzed:**
\`\`\`json
{
  "message": "File re-analyzed successfully",
  "fileStorageId": "abc123-def456",
  "status": "analyzed",
  "metadata": { ... },
  "thumbnailCount": 1
}
\`\`\`

**Errors:**
- \`404 Not Found\` — File not found
- \`500 Internal Server Error\` — Analysis failed
- \`401 Unauthorized\`, \`403 Forbidden\` — Authentication/authorization

---

### Bulk Delete Files

**\`POST /api/file-storage/bulk/delete\`**

Delete multiple files at once.

**Request:**
\`\`\`json
{
  "fileIds": ["id1", "id2", "id3"],
  "force": false
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "deleted": 3,
  "filesDeleted": 2,
  "filesStillInUse": 1,
  "errors": [
    {
      "fileId": "id3",
      "reason": "Still referenced by 2 jobs"
    }
  ]
}
\`\`\`

**Errors:**
- \`400 Bad Request\` — Invalid request body
- \`401 Unauthorized\`, \`403 Forbidden\` — Authentication/authorization

---

## Error Responses

All errors follow this format:

\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
\`\`\`

**Common Error Codes:**
- \`UNAUTHORIZED\` — Missing/invalid authentication
- \`FORBIDDEN\` — Insufficient permissions
- \`NOT_FOUND\` — Resource not found
- \`BAD_REQUEST\` — Invalid input
- \`CONFLICT\` — Resource already exists
- \`INTERNAL_ERROR\` — Server error

---

## Related Documents

- [\`../features/file-crud-api.md\`](../features/file-crud-api.md) — Feature proposal
- [\`../architecture/file-storage.md\`](../architecture/file-storage.md) — Architecture
