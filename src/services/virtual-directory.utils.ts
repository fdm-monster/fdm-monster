import { join } from "node:path";
import { writeFile, readdir, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";

export interface VirtualDirectoryMarker {
  type: "directory";
  path: string;
  createdAt: string;
  _fileStorageId: string;
}

export async function createVirtualDirectory(
  basePath: string,
  virtualPath: string
): Promise<Array<{ path: string; markerId: string }>> {
  const segments = virtualPath.split("/").filter(s => s.length > 0);
  const createdMarkers: Array<{ path: string; markerId: string }> = [];

  const existingMarkers = await listVirtualDirectories(basePath);
  const existingPaths = new Set(existingMarkers.map(m => m.path));

  for (let i = 0; i < segments.length; i++) {
    const currentPath = segments.slice(0, i + 1).join("/");

    if (existingPaths.has(currentPath)) {
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
        }
      }
    } catch {
    }
  }

  return markers;
}

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
    }
  }

  return false;
}

export interface TreeNode {
  path: string;
  name: string;
  type: "file" | "directory";
  children?: TreeNode[];
  fileStorageId?: string;
  markerId?: string;
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

  const virtualDirMap = new Map<string, string>();
  for (const dir of virtualDirs) {
    if (dir.path) {
      virtualDirMap.set(dir.path, dir._fileStorageId);
    }
  }

  const allPaths = new Set<string>();

  for (const dir of virtualDirs) {
    if (dir.path) {
      allPaths.add(dir.path);
      const parts = dir.path.split("/");
      for (let i = 1; i < parts.length; i++) {
        allPaths.add(parts.slice(0, i).join("/"));
      }
    }
  }

  for (const file of files) {
    const filePath = file.metadata?._path || file.metadata?.path || "";
    if (filePath) {
      allPaths.add(filePath);
      const parts = filePath.split("/");
      for (let i = 1; i < parts.length; i++) {
        allPaths.add(parts.slice(0, i).join("/"));
      }
    }
  }

  const sortedPaths = Array.from(allPaths).sort((a,b) => a.localeCompare(b));
  for (const path of sortedPaths) {
    if (!path) continue;

    const parts = path.split("/");
    const name = parts.at(-1)?.toString() || "";
    const parentPath = parts.slice(0, -1).join("/");

    const node: TreeNode = {
      path,
      name,
      type: "directory",
      children: [],
    };

    const markerId = virtualDirMap.get(path);
    if (markerId) {
      node.markerId = markerId;
    }

    pathMap.set(path, node);

    const parent = pathMap.get(parentPath);
    if (parent?.children) {
      parent.children.push(node);
    }
  }

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
    if (parent?.children) {
      parent.children.push(fileNode);
    }
  }

  return root;
}
