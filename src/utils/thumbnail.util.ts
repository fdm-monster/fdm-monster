export interface ThumbnailInfo {
  index: number;
  width: number;
  height: number;
  format: string;
  size: number;
}

export function extractThumbnailsFromMetadata(metadata: any): ThumbnailInfo[] {
  if (!metadata?._thumbnails) {
    return [];
  }

  return (metadata._thumbnails || []).map((thumb: any) => ({
    index: thumb.index,
    width: thumb.width,
    height: thumb.height,
    format: thumb.format,
    size: thumb.size,
  }));
}
