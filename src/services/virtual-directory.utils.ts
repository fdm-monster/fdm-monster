// edited by claude on 2026.01.25.13.30
import { join } from "node:path";
import { writeFile, readdir, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";

/**
 * Utility functions for managing virtual directory markers
 * Virtual directories are represented as JSON-only files with type: "directory"
 */

export interface VirtualDirectoryMarker {
  type: "directory";
  path: string;
  createdAt: string;
  _fileStorageId: string;
}

/**
 * Create a virtual directory marker
 * edited by claude on 2026.01.25.15.00
 * Now creates markers for ALL intermediate paths in nested paths
 * e.g., "a/b/c" creates markers for "a", "a/b", and "a/b/c"
 * Returns an array of created markers with path and markerId
 */
export async function createVirtualDirectory(
  basePath: string,
  virtualPath: string
): Promise<Array<{ path: string; markerId: string }>> {
  const segments = virtualPath.split("/").filter(s => s.length > 0);
  const createdMarkers: Array<{ path: string; markerId: string }> = [];

  // Get existing virtual directories to avoid duplicates
  const existingMarkers = await listVirtualDirectories(basePath);
  const existingPaths = new Set(existingMarkers.map(m => m.path));

  // Create markers for each level of the path
  for (let i = 0; i < segments.length; i++) {
    const currentPath = segments.slice(0, i + 1).join("/");

    // Skip if marker already exists for this path
    if (existingPaths.has(currentPath)) {
      // Find the existing marker ID
      const existing = existingMarkers.find(m => m.path === currentPath);
      if (existing) {
        createdMarkers.push({ path: currentPath, markerId: existing._fileStorageId });
      }
      continue;
    }

    const markerId = randomUUID();
    const markerFilePath = join(basePath, "gcode", `${markerId}.json`);

    const marker: VirtualDirectoryMarker = {
      type: "directory",
      path: currentPath,
      createdAt: new Date().toISOString(),
      _fileStorageId: markerId,
    };

    await writeFile(markerFilePath, JSON.stringify(marker, null, 2), "utf8");
    createdMarkers.push({ path: currentPath, markerId });
  }

  return createdMarkers;
}
// End of Claude's edit

/**
 * List all virtual directory markers
 */
export async function listVirtualDirectories(
  basePath: string
): Promise<VirtualDirectoryMarker[]> {
  const markers: VirtualDirectoryMarker[] = [];
  const subdirs = ["gcode", "3mf", "bgcode"];

  for (const subdir of subdirs) {
    const dirPath = join(basePath, subdir);
    try {
      const files = await readdir(dirPath);

      for (const file of files) {
        if (!file.endsWith(".json")) continue;

        try {
          const content = await import("node:fs/promises").then((fs) =>
            fs.readFile(join(dirPath, file), "utf8")
          );
          const json = JSON.parse(content);

          if (json.type === "directory") {
            markers.push(json as VirtualDirectoryMarker);
          }
        } catch {
          // Skip invalid JSON files
        }
      }
    } catch {
      // Directory might not exist
    }
  }

  return markers;
}

/**
 * Delete a virtual directory marker
 */
export async function deleteVirtualDirectory(
  basePath: string,
  markerId: string
): Promise<boolean> {
  const subdirs = ["gcode", "3mf", "bgcode"];

  for (const subdir of subdirs) {
    const markerPath = join(basePath, subdir, `${markerId}.json`);
    try {
      await unlink(markerPath);
      return true;
    } catch {
      // Try next subdir
    }
  }

  return false;
}

/**
 * Build directory tree from file metadata and virtual directory markers
 */
export interface TreeNode {
  path: string;
  name: string;
  type: "file" | "directory";
  children?: TreeNode[];
  fileStorageId?: string; // For files
  markerId?: string; // edited by claude on 2026.01.25.14.30 - For virtual directories
  metadata?: any;
}

export function buildDirectoryTree(
  files: Array<{ fileStorageId: string; metadata?: any }>,
  virtualDirs: VirtualDirectoryMarker[]
): TreeNode {
  const root: TreeNode = {
    path: "",
    name: "root",
    type: "directory",
    children: [],
  };

  const pathMap = new Map<string, TreeNode>();
  pathMap.set("", root);

  // edited by claude on 2026.01.25.14.30
  // Create a map of virtual directory paths to their markerIds
  const virtualDirMap = new Map<string, string>();
  for (const dir of virtualDirs) {
    if (dir.path) {
      virtualDirMap.set(dir.path, dir._fileStorageId);
    }
  }
  // End of Claude's edit

  // Collect all paths (from files and virtual directories)
  const allPaths = new Set<string>();

  // edited by claude on 2026.01.25.14.10
  // Add virtual directory paths and their parent directories
  for (const dir of virtualDirs) {
    if (dir.path) {
      allPaths.add(dir.path);
      // Add all parent directories
      const parts = dir.path.split("/");
      for (let i = 1; i < parts.length; i++) {
        allPaths.add(parts.slice(0, i).join("/"));
      }
    }
  }
  // End of Claude's edit

  // Add file paths and their parent directories
  for (const file of files) {
    const filePath = file.metadata?._path || file.metadata?.path || "";
    if (filePath) {
      allPaths.add(filePath);
      // Add all parent directories
      const parts = filePath.split("/");
      for (let i = 1; i < parts.length; i++) {
        allPaths.add(parts.slice(0, i).join("/"));
      }
    }
  }

  // edited by claude on 2026.01.25.14.30
  // Create directory nodes
  const sortedPaths = Array.from(allPaths).sort((a,b) => a.localeCompare(b));
  for (const path of sortedPaths) {
    if (!path) continue;

    const parts = path.split("/");
    const name = parts.at(-1);
    const parentPath = parts.slice(0, -1).join("/");

    const node: TreeNode = {
      path,
      name,
      type: "directory",
      children: [],
    };

    // If this is a virtual directory, include the markerId
    const markerId = virtualDirMap.get(path);
    if (markerId) {
      node.markerId = markerId;
    }

    pathMap.set(path, node);

    const parent = pathMap.get(parentPath);
    if (parent && parent.children) {
      parent.children.push(node);
    }
  }
  // End of Claude's edit

  // Add file nodes
  for (const file of files) {
    const filePath = file.metadata?._path || file.metadata?.path || "";
    const fileName =
      file.metadata?._originalFileName ||
      file.metadata?.fileName ||
      file.fileStorageId;

    const fileNode: TreeNode = {
      path: filePath ? `${filePath}/${fileName}` : fileName,
      name: fileName,
      type: "file",
      fileStorageId: file.fileStorageId,
      metadata: file.metadata,
    };

    const parent = pathMap.get(filePath);
    if (parent && parent.children) {
      parent.children.push(fileNode);
    }
  }

  return root;
}
// End of Claude's edit
