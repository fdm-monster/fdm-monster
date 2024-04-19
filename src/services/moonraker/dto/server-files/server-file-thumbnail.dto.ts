export interface ServerFileThumbnailDto {
  width: number;
  height: number;
  size: number;
  // Relative to gcodes root
  thumbnail_path: string;
}
