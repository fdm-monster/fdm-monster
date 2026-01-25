# File Storage API Documentation

## Overview
The File Storage API provides endpoints to manage 3D print files with virtual folder organization through metadata. Files are stored as OID-based blobs with metadata in JSON format.

**Base URL:** `/api/v2/file-storage`

**Authentication:** Required (ADMIN or OPERATOR role)

---

## Endpoints

### 1. List All Files
**GET** `/api/v2/file-storage`

Returns a list of all stored files with their metadata.

**Response:**
```json
{
  "files": [
    {
      "fileStorageId": "81edd14d-0531-c7a9-e355-97b9ff57129a",
      "fileName": "benchy.gcode",
      "fileFormat": "gcode",
      "fileSize": 1234567,
      "fileHash": "abc123...",
      "createdAt": "2026-01-24T12:00:00.000Z",
      "thumbnails": [
        {
          "index": 0,
          "width": 200,
          "height": 200,
          "format": "png",
          "size": 12345
        }
      ],
      "metadata": {
        "_path": "projects/boats",
        "_originalFileName": "benchy.gcode",
        "_fileHash": "abc123...",
        "_analyzedAt": "2026-01-24T12:00:00.000Z",
        "_fileStorageId": "81edd14d-0531-c7a9-e355-97b9ff57129a",
        "_thumbnails": [...],
        "fileFormat": "gcode",
        "totalLayers": 250,
        "gcodePrintTimeSeconds": 3600,
        "filamentUsedGrams": 15.5
      }
    }
  ],
  "totalCount": 1
}
```

---

### 2. Get File Metadata
**GET** `/api/v2/file-storage/:fileStorageId`

Retrieves metadata for a specific file.

**Parameters:**
- `fileStorageId` (path, required): UUID of the file

**Response:**
```json
{
  "fileStorageId": "81edd14d-0531-c7a9-e355-97b9ff57129a",
  "fileName": "benchy.gcode",
  "fileFormat": "gcode",
  "fileSize": 1234567,
  "fileHash": "abc123...",
  "createdAt": "2026-01-24T12:00:00.000Z",
  "thumbnails": [
    {
      "index": 0,
      "width": 200,
      "height": 200,
      "format": "png",
      "size": 12345
    }
  ],
  "metadata": {
    "_path": "projects/boats",
    "_originalFileName": "benchy.gcode",
    "_fileHash": "abc123...",
    "_analyzedAt": "2026-01-24T12:00:00.000Z",
    "_fileStorageId": "81edd14d-0531-c7a9-e355-97b9ff57129a",
    "_thumbnails": [...],
    "fileFormat": "gcode",
    "totalLayers": 250,
    "gcodePrintTimeSeconds": 3600,
    "filamentUsedGrams": 15.5
  }
}
```

**Error Responses:**
- `404`: File not found
- `500`: Server error

---

### 3. Update File Metadata (Single File)
**PATCH** `/api/v2/file-storage/:fileStorageId`

Updates file metadata including virtual folder path, fileName, and custom metadata fields.

**Parameters:**
- `fileStorageId` (path, required): UUID of the file

**Request Body:**
```json
{
  "fileName": "new-filename.gcode",
  "path": "projects/boats/prints",
  "metadata": {
    "customField": "customValue"
  }
}
```

**Field Descriptions:**
- `fileName` (optional): Full file name with extension (e.g., "benchy.gcode")
  - Min length: 1 character
  - Max length: 500 characters
  - Allowed characters: alphanumeric, `/`, `-`, `_`, `.`, space
  - Cannot contain `..` (parent directory references)
  - Cannot start with `/`

- `path` (optional): Virtual folder path (directory only, no filename)
  - Max length: 500 characters
  - Allowed characters: alphanumeric, `/`, `-`, `_`, `.`, space
  - Empty string `""` represents root folder
  - Cannot contain `..` (parent directory references)
  - Cannot start with `/`
  - Cannot end with `/` (except empty string for root)

- `metadata` (optional): Object with custom metadata fields to merge

**At least one field (fileName, path, or metadata) must be provided.**

**Response:**
```json
{
  "fileStorageId": "81edd14d-0531-c7a9-e355-97b9ff57129a",
  "fileName": "new-filename.gcode",
  "fileFormat": "gcode",
  "fileSize": 1234567,
  "fileHash": "abc123...",
  "createdAt": "2026-01-24T12:00:00.000Z",
  "thumbnails": [...],
  "metadata": {
    "_path": "projects/boats/prints",
    "_originalFileName": "new-filename.gcode",
    "customField": "customValue",
    ...
  }
}
```

**Error Responses:**
- `400`: Validation error (invalid path format, missing required fields)
- `404`: File not found
- `500`: Server error

**Important Notes:**
- Only updates metadata JSON file, does not move physical file
- `fileHash` remains immutable (content-based, not path-based)
- Updates are merged with existing metadata (non-destructive)
- The `_path` field is stored separately from `fileName`

---

### 4. Batch Update File Metadata
**PATCH** `/api/v2/file-storage/batch`

Updates metadata for multiple files in a single request. Useful for folder rename operations.

**Request Body:**
```json
{
  "updates": [
    {
      "fileStorageId": "81edd14d-0531-c7a9-e355-97b9ff57129a",
      "path": "projects/renamed-folder",
      "metadata": {
        "customField": "value1"
      }
    },
    {
      "fileStorageId": "92fee25e-1642-d8ba-f466-a8cab068230b",
      "fileName": "new-name.gcode",
      "path": "projects/renamed-folder"
    }
  ]
}
```

**Field Descriptions:**
- `updates` (required): Array of update objects (min: 1, max: 100)
  - `fileStorageId` (required): UUID of file to update
  - `fileName` (optional): New file name (same validation as single update)
  - `path` (optional): New virtual folder path (same validation as single update)
  - `metadata` (optional): Custom metadata fields to merge

**Response:**
```json
{
  "message": "Batch update completed",
  "successCount": 2,
  "failedCount": 0,
  "success": [
    {
      "fileStorageId": "81edd14d-0531-c7a9-e355-97b9ff57129a"
    },
    {
      "fileStorageId": "92fee25e-1642-d8ba-f466-a8cab068230b"
    }
  ],
  "failed": []
}
```

**Error Response (Partial Failure):**
```json
{
  "message": "Batch update completed",
  "successCount": 1,
  "failedCount": 1,
  "success": [
    {
      "fileStorageId": "81edd14d-0531-c7a9-e355-97b9ff57129a"
    }
  ],
  "failed": [
    {
      "fileStorageId": "invalid-id",
      "error": "File invalid-id not found"
    }
  ]
}
```

**Error Responses:**
- `400`: Validation error (invalid format, too many files, empty array)
- `500`: Server error

**Important Notes:**
- Maximum 100 files per batch request
- Partial success is supported (some files may succeed while others fail)
- Each file update is processed independently
- Failed updates do not rollback successful updates

---

### 5. Delete File
**DELETE** `/api/v2/file-storage/:fileStorageId`

Deletes a file and its associated metadata and thumbnails.

**Parameters:**
- `fileStorageId` (path, required): UUID of the file

**Response:**
```json
{
  "message": "File deleted successfully",
  "fileStorageId": "81edd14d-0531-c7a9-e355-97b9ff57129a"
}
```

**Error Responses:**
- `500`: Server error

---

### 6. Upload File
**POST** `/api/v2/file-storage/upload`

Uploads a new file, analyzes it, and stores it with metadata.

**Request:** `multipart/form-data`
- File field name: `file`
- Accepted extensions: `.gcode`, `.3mf`, `.bgcode`

**Response:**
```json
{
  "message": "File uploaded successfully",
  "fileStorageId": "81edd14d-0531-c7a9-e355-97b9ff57129a",
  "fileName": "benchy.gcode",
  "fileSize": 1234567,
  "fileHash": "abc123...",
  "metadata": {
    "fileFormat": "gcode",
    "totalLayers": 250,
    "gcodePrintTimeSeconds": 3600,
    ...
  },
  "thumbnailCount": 2
}
```

**Error Responses:**
- `400`: No file uploaded or invalid file type
- `500`: Server error

---

### 7. Analyze File
**POST** `/api/v2/file-storage/:fileStorageId/analyze`

Re-analyzes an existing file to extract/update metadata and thumbnails.

**Parameters:**
- `fileStorageId` (path, required): UUID of the file

**Response:**
```json
{
  "message": "File analyzed successfully",
  "fileStorageId": "81edd14d-0531-c7a9-e355-97b9ff57129a",
  "metadata": {
    "fileFormat": "gcode",
    "totalLayers": 250,
    ...
  },
  "thumbnailCount": 2
}
```

**Error Responses:**
- `404`: File not found
- `500`: Server error

---

### 8. Get Thumbnail
**GET** `/api/v2/file-storage/:fileStorageId/thumbnail/:index`

Retrieves a specific thumbnail image for a file.

**Parameters:**
- `fileStorageId` (path, required): UUID of the file
- `index` (path, required): Thumbnail index (0-based)

**Response:**
```json
{
  "thumbnailBase64": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Error Responses:**
- `400`: Invalid thumbnail index
- `404`: Thumbnail not found or unsupported format (QOI)
- `500`: Server error

---

## Data Models

### FileMetadata
```typescript
interface FileMetadata {
  fileStorageId: string;           // UUID of the file
  fileName: string;                 // Display name (from _originalFileName)
  fileFormat: string;               // File extension (gcode, 3mf, bgcode)
  fileSize: number;                 // Size in bytes
  fileHash: string;                 // SHA256 hash of file content
  createdAt: Date;                  // File creation timestamp
  thumbnails: Thumbnail[];          // Array of thumbnail metadata
  metadata: {
    _path?: string;                 // Virtual folder path (e.g., "projects/boats")
    _originalFileName: string;      // Original file name
    _fileHash: string;              // SHA256 hash (redundant with fileHash)
    _analyzedAt: string;            // ISO timestamp of last analysis
    _fileStorageId: string;         // UUID (redundant with fileStorageId)
    _thumbnails: ThumbnailMeta[];   // Thumbnail storage metadata

    // Analysis results (GCODE files)
    fileFormat?: string;
    totalLayers?: number;
    gcodePrintTimeSeconds?: number;
    filamentUsedGrams?: number;
    filamentUsedMillimeters?: number;
    bedTemperature?: number;
    nozzleTemperature?: number;
    layerHeight?: number;
    firstLayerHeight?: number;

    // Custom fields
    [key: string]: any;
  };
}
```

### Thumbnail
```typescript
interface Thumbnail {
  index: number;      // Thumbnail index (0-based)
  width: number;      // Image width in pixels
  height: number;     // Image height in pixels
  format: string;     // Image format (png, jpg, qoi)
  size: number;       // File size in bytes
}
```

---

## Virtual Folder Organization

The `path` field in metadata enables virtual folder organization without moving physical files:

### Example Structure:
```
Root ("")
├── projects/
│   ├── boats/
│   │   └── benchy.gcode (path: "projects/boats")
│   └── miniatures/
│       └── dragon.gcode (path: "projects/miniatures")
└── tests/
    └── calibration.gcode (path: "tests")
```

### Path Rules:
- Empty string `""` = root folder
- No leading or trailing slashes
- Use `/` as folder separator
- Cannot contain `..` (security)
- Max 500 characters

### Moving Files:
```json
// Move file to new folder
PATCH /api/v2/file-storage/81edd14d-0531-c7a9-e355-97b9ff57129a
{
  "path": "projects/boats/new-subfolder"
}

// Move to root
PATCH /api/v2/file-storage/81edd14d-0531-c7a9-e355-97b9ff57129a
{
  "path": ""
}
```

### Renaming Folders (Batch):
```json
// Rename "projects/boats" to "projects/ships"
PATCH /api/v2/file-storage/batch
{
  "updates": [
    {
      "fileStorageId": "file1-uuid",
      "path": "projects/ships"
    },
    {
      "fileStorageId": "file2-uuid",
      "path": "projects/ships"
    }
  ]
}
```

---

## Security & Validation

### Path Validation:
- ✅ Prevents directory traversal (`..` blocked)
- ✅ Restricts to safe characters
- ✅ Enforces length limits
- ✅ No absolute paths allowed
- ✅ Server-side validation via Zod schemas

### Authentication:
- All endpoints require authentication
- ADMIN or OPERATOR role required
- JWT token in Authorization header

### File Storage:
- Physical files stored as UUID-based blobs
- Metadata stored in separate `.json` files
- `fileHash` is immutable (content-based)
- Changing `path` or `fileName` does not affect physical storage

---

## Frontend Integration Tips

### Building a Tree View:
1. Fetch all files with `GET /api/v2/file-storage`
2. Parse `metadata._path` to build folder hierarchy
3. Use `fileName` for display name
4. Use `fileStorageId` as unique key

### Moving Files (Drag & Drop):
1. Determine new path from drop target
2. Call `PATCH /api/v2/file-storage/:fileStorageId` with new `path`
3. Update UI on success

### Renaming Folders:
1. Find all files with `metadata._path` matching old folder path
2. Build batch update request with new paths
3. Call `PATCH /api/v2/file-storage/batch`
4. Update UI based on success/failed results

### Error Handling:
- Display validation errors from 400 responses
- Handle partial failures in batch operations
- Show user-friendly messages for 404/500 errors

---

## Version History
- **2026-01-24**: Added `path` field support for virtual folder organization
- **2026-01-24**: Initial PATCH endpoints for metadata updates
