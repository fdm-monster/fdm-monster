export interface ServerFileDirectoryInfoDto {
  dirs: Dir[];
  files: File[];
  disk_usage: DiskUsage;
  root_info: RootInfo;
}

export interface Dir {
  modified: number;
  size: number;
  permissions: string;
  dirname: string;
}

export interface File {
  modified: number;
  size: number;
  permissions: string;
  filename: string;
}

export interface DiskUsage {
  total: number;
  used: number;
  free: number;
}

export interface RootInfo {
  name: string;
  permissions: string;
}
