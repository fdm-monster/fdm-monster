import { BgCodeThumbnailFormats, BgCodeThumbnailParameters } from "./bgcode.types.mts";
import { decodeQOI } from "./qoi-decoder.mts";
import { encodePNG } from "./png-encoder.mts";

export interface ThumbnailProcessResult {
  extension: string;
  data: Buffer;
  converted?: boolean;
}

export function processThumbnail(data: Buffer, parameters: BgCodeThumbnailParameters): ThumbnailProcessResult {
  if (parameters.format === BgCodeThumbnailFormats.PNG) {
    return {
      extension: 'png',
      data: data
    };
  } else if (parameters.format === BgCodeThumbnailFormats.JPG) {
    return {
      extension: 'jpg',
      data: data
    };
  } else if (parameters.format === BgCodeThumbnailFormats.QOI) {
    // Convert QOI to PNG
    const decoded = decodeQOI(data);
    const pngData = encodePNG(decoded.width, decoded.height, decoded.data);
    return {
      extension: 'png',
      data: pngData,
      converted: true
    };
  }

  throw new Error(`Unsupported thumbnail format: ${parameters.format}`);
}
