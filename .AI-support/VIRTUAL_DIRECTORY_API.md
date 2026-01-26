# Virtual Directory API Documentation

**Base URL**: `/api/v2/file-storage`

## Virtual Directory System Overview
This API manages a virtual directory structure for file organization. Files have a `_path` attribute (e.g., `"calibration tests/PLA/0.4"`) that defines their location in the virtual folder hierarchy. Empty directories are represented as JSON marker files with `type: "directory"`.

## API Endpoints

### 1. Get Complete Directory Tree
```http
GET /api/v2/file-storage/directory-tree
```

**Response:**
```json
{
  "tree": {
    "path": "",
    "name": "root",
    "type": "directory",
    "children": [
      {
        "path": "calibration tests",
        "name": "calibration tests",
        "type": "directory",
        "children": [
          {
            "path": "calibration tests/flowrate_0.4_PLA.gcode",
            "name": "flowrate_0.4_PLA.gcode",
            "type": "file",
            "fileStorageId": "0a0c239a-4e18-e4c1-0eb8-d4c1c80cd49e",
            "metadata": { /* file metadata */ }
          }
        ]
      }
    ]
  }
}
```

**Use Case**: Build tree view UI showing folders and files hierarchically.

---

### 2. List All Virtual Directories
```http
GET /api/v2/file-storage/virtual-directories
```

**Response:**
```json
{
  "directories": [
    {
      "markerId": "abc-123-def-456",
      "path": "empty/folder/path",
      "createdAt": "2026-01-25T13:30:00.000Z"
    }
  ],
  "count": 1
}
```

**Use Case**: Show list of empty directories, manage virtual folders.

---

### 3. Create Empty Directory
```http
POST /api/v2/file-storage/virtual-directories
Content-Type: application/json

{
  "path": "new/empty/directory"
}
```

**Response:**
```json
{
  "message": "Virtual directory created",
  "markerId": "abc-123-def-456",
  "path": "new/empty/directory"
}
```

**Use Case**: Create folder before moving files into it. Supports nested paths (e.g., `"projects/3d-prints/pending"`).

---

### 4. Delete Empty Directory
```http
DELETE /api/v2/file-storage/virtual-directories/:markerId
```

**Response:**
```json
{
  "message": "Virtual directory deleted",
  "markerId": "abc-123-def-456"
}
```

**Use Case**: Remove empty folder from hierarchy.

---

### 5. Move File to Directory (Existing Endpoint)
```http
PATCH /api/v2/file-storage/:fileStorageId
Content-Type: application/json

{
  "path": "target/directory/path"
}
```

**Response:**
```json
{
  "fileStorageId": "0a0c239a-4e18-e4c1-0eb8-d4c1c80cd49e",
  "fileName": "file.gcode",
  "metadata": {
    "_path": "target/directory/path",
    /* other metadata */
  }
}
```

**Use Case**: Move file to existing or new directory by updating its `_path`.

---

## Frontend Integration Examples

**Example 1: Create New Folder**
```typescript
async function createFolder(folderPath: string) {
  const response = await fetch('/api/v2/file-storage/virtual-directories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: folderPath })
  });
  return response.json();
}
```

**Example 2: Move File to Folder**
```typescript
async function moveFile(fileStorageId: string, targetPath: string) {
  const response = await fetch(`/api/v2/file-storage/${fileStorageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: targetPath })
  });
  return response.json();
}
```

**Example 3: Load Directory Tree**
```typescript
async function loadDirectoryTree() {
  const response = await fetch('/api/v2/file-storage/directory-tree');
  const data = await response.json();
  return data.tree;
}
```

---

## Important Notes

1. **Path Format**: Use forward slashes (`/`) for nested directories (e.g., `"parent/child/grandchild"`)
2. **Root Files**: Files with empty string `""` or no `_path` appear at root level
3. **Dynamic Tree**: Tree is built on-demand from file metadata, no manual sync needed
4. **Nested Creation**: Creating `"a/b/c"` automatically creates parent directories in tree
5. **Empty Folders Persist**: Virtual directories remain even when all files are moved out

---

Use this API documentation when implementing file/folder management UI in the Vue frontend application.
