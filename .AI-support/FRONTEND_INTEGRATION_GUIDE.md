# Frontend Integration Guide - Virtual Directory System

**Created**: 2026-01-25
**Backend Status**: ✅ Complete & Tested
**Frontend Status**: ⏳ Pending Implementation

---

## Overview

The backend now supports **empty virtual directories** for file organization. Previously, folders could only exist if they contained files. Now you can create empty folders and organize files into a hierarchical tree structure.

---

## What Changed in the Backend

### New API Endpoints Available

#### 1. Get Complete Directory Tree
```http
GET /api/v2/file-storage/directory-tree
```

**Returns:**
```json
{
  "tree": {
    "path": "",
    "name": "root",
    "type": "directory",
    "children": [
      {
        "path": "projects",
        "name": "projects",
        "type": "directory",
        "children": [
          {
            "path": "projects/test.gcode",
            "name": "test.gcode",
            "type": "file",
            "fileStorageId": "abc-123",
            "metadata": { /* full file metadata */ }
          }
        ]
      }
    ]
  }
}
```

**Use this to:** Build your tree view UI with folders and files

---

#### 2. List Virtual Directories
```http
GET /api/v2/file-storage/virtual-directories
```

**Returns:**
```json
{
  "directories": [
    {
      "markerId": "uuid-123",
      "path": "empty/folder",
      "createdAt": "2026-01-25T13:30:00.000Z"
    }
  ],
  "count": 1
}
```

**Use this to:** Show/manage empty folders separately if needed

---

#### 3. Create Empty Directory
```http
POST /api/v2/file-storage/virtual-directories
Content-Type: application/json

{
  "path": "new/folder/path"
}
```

**Returns:**
```json
{
  "message": "Virtual directory created",
  "markerId": "uuid-456",
  "path": "new/folder/path"
}
```

**Use this to:** Implement "New Folder" functionality

**Important:**
- Path uses forward slashes: `"parent/child/grandchild"`
- Automatically creates parent folders in tree
- Empty string `""` = root level

---

#### 4. Delete Empty Directory
```http
DELETE /api/v2/file-storage/virtual-directories/:markerId
```

**Returns:**
```json
{
  "message": "Virtual directory deleted",
  "markerId": "uuid-456"
}
```

**Use this to:** Remove empty folders

---

### Existing Endpoint - Now More Useful

#### Move File to Directory
```http
PATCH /api/v2/file-storage/:fileStorageId
Content-Type: application/json

{
  "path": "target/folder/path"
}
```

**This endpoint already existed** but now you can move files into empty directories you've created!

---

## Frontend Implementation Tasks

### 1. Tree View Component Updates

**Current Behavior:**
- Likely shows flat list or basic folders based on file paths
- Can't create empty folders

**New Behavior Needed:**
- Fetch tree from `GET /api/v2/file-storage/directory-tree`
- Render hierarchical tree with expand/collapse
- Show both files and folders (including empty ones)
- Visual distinction between folders and files

**Example Vue Composable:**
```typescript
// src/composables/useDirectoryTree.ts
import { ref } from 'vue';

export function useDirectoryTree() {
  const tree = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function loadTree() {
    loading.value = true;
    try {
      const response = await fetch('/api/v2/file-storage/directory-tree');
      const data = await response.json();
      tree.value = data.tree;
    } catch (e) {
      error.value = e;
    } finally {
      loading.value = false;
    }
  }

  return { tree, loading, error, loadTree };
}
```

---

### 2. Create Folder Dialog

**What to Build:**
- Button: "New Folder" in file manager toolbar
- Dialog with text input for folder path
- Validation: no special chars except `/`, no leading/trailing slashes
- Call API to create folder
- Refresh tree view after creation

**Example Implementation:**
```vue
<script setup lang="ts">
import { ref } from 'vue';

const showDialog = ref(false);
const folderPath = ref('');
const loading = ref(false);

async function createFolder() {
  loading.value = true;
  try {
    const response = await fetch('/api/v2/file-storage/virtual-directories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: folderPath.value })
    });

    if (response.ok) {
      // Success - refresh tree
      await loadTree();
      showDialog.value = false;
      folderPath.value = '';
    }
  } catch (error) {
    console.error('Failed to create folder:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-dialog v-model="showDialog">
    <v-card>
      <v-card-title>Create New Folder</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="folderPath"
          label="Folder Path"
          hint="Use / for nested folders (e.g., projects/2024/prints)"
          persistent-hint
        />
      </v-card-text>
      <v-card-actions>
        <v-btn @click="showDialog = false">Cancel</v-btn>
        <v-btn @click="createFolder" :loading="loading" color="primary">
          Create
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

---

### 3. Move File to Folder

**What to Update:**
- Context menu on files: "Move to..."
- Folder picker dialog showing tree structure
- Call existing PATCH endpoint with new `path` value
- Refresh tree after move

**Example:**
```typescript
async function moveFile(fileStorageId: string, targetPath: string) {
  const response = await fetch(`/api/v2/file-storage/${fileStorageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: targetPath })
  });

  if (response.ok) {
    await loadTree(); // Refresh
  }
}
```

---

### 4. Delete Empty Folder

**What to Build:**
- Context menu on folders: "Delete" (only for empty folders)
- Confirmation dialog
- Call DELETE endpoint with `markerId`
- Refresh tree after deletion

**Important:**
- Empty folders have a `markerId` (returned from virtual-directories list)
- Folders with files should show different delete behavior (future feature)

---

## Tree Node Structure Reference

```typescript
interface TreeNode {
  path: string;           // e.g., "projects/2024"
  name: string;           // e.g., "2024"
  type: "file" | "directory";
  children?: TreeNode[];  // Only for directories
  fileStorageId?: string; // Only for files
  metadata?: any;         // Only for files - full file metadata
}
```

**Directory Node Example:**
```json
{
  "path": "calibration tests",
  "name": "calibration tests",
  "type": "directory",
  "children": []
}
```

**File Node Example:**
```json
{
  "path": "calibration tests/test.gcode",
  "name": "test.gcode",
  "type": "file",
  "fileStorageId": "0a0c239a-4e18-e4c1-0eb8-d4c1c80cd49e",
  "metadata": {
    "_path": "calibration tests",
    "_originalFileName": "test.gcode",
    "fileSize": 1505304,
    // ... all other file metadata
  }
}
```

---

## Important Notes for Frontend

### Path Format
- Always use forward slashes: `"parent/child"`
- No leading slash: `"folder"` not `"/folder"`
- No trailing slash: `"folder"` not `"folder/"`
- Empty string `""` = root level

### Root Level Files
- Files with `_path: ""` or no `_path` appear at root
- They are direct children of the root node

### Tree Refresh Strategy
- Refresh tree after: create folder, delete folder, move file
- Consider caching tree and only refreshing on changes
- Tree is built dynamically on backend, so always up-to-date

### Error Handling
- `400`: Invalid path format
- `404`: File or folder not found
- `500`: Server error (check logs)

---

## Testing Your Integration

### Manual Test Workflow

1. **Create empty folder:**
   ```bash
   curl -X POST http://localhost:4000/api/v2/file-storage/virtual-directories \
     -H "Content-Type: application/json" \
     -d '{"path":"test/folder"}'
   ```

2. **Get tree (should show empty folder):**
   ```bash
   curl http://localhost:4000/api/v2/file-storage/directory-tree
   ```

3. **Move a file into folder:**
   ```bash
   curl -X PATCH http://localhost:4000/api/v2/file-storage/{fileStorageId} \
     -H "Content-Type: application/json" \
     -d '{"path":"test/folder"}'
   ```

4. **Get tree again (should show file in folder):**
   ```bash
   curl http://localhost:4000/api/v2/file-storage/directory-tree
   ```

5. **Delete empty folder:**
   ```bash
   curl -X DELETE http://localhost:4000/api/v2/file-storage/virtual-directories/{markerId}
   ```

---

## Questions to Ask Backend Claude

If you run into issues:

1. "The tree structure isn't showing parent folders correctly"
2. "I'm getting 404 when calling the directory-tree endpoint"
3. "Files aren't appearing in the correct folders after moving them"
4. "How do I handle deleting folders that contain files?"
5. "Can I batch-create multiple folders at once?"

---

## Related Documentation

- Full API docs: `.AI-support/VIRTUAL_DIRECTORY_API.md`
- Backend code: `src/services/virtual-directory.utils.ts`
- Backend tests: `test/api/file-storage-virtual-directories.test.ts`

---

## Summary Checklist

Frontend needs to implement:
- [ ] Tree view component that uses new directory-tree endpoint
- [ ] "New Folder" button and dialog
- [ ] Folder picker for moving files
- [ ] Context menu with "Move to..." option
- [ ] Delete empty folder functionality
- [ ] Tree refresh after operations
- [ ] Path validation (forward slashes, no leading/trailing slashes)

Backend is ready to support all of this! 🚀
