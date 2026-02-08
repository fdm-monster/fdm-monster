import { BgCodeThumbnailFormats, BgCodeThumbnailParameters, BgCodeThumbnailFormatExtension } from "./bgcode.types";
import { decodeQOI } from "./qoi-decoder";
import { encodePNG } from "./png-encoder";

export interface ThumbnailProcessResult {
  extension: string;
  data: Buffer;
  converted?: boolean;
}

export function convertQoiToPng(qoiBuffer: Buffer): Buffer {
  const decoded = decodeQOI(qoiBuffer);
  return encodePNG(decoded.width, decoded.height, decoded.data);
}

export function processThumbnail(data: Buffer, parameters: BgCodeThumbnailParameters): ThumbnailProcessResult {
  switch (parameters.format) {
    case BgCodeThumbnailFormats.PNG:
      return {
        extension: BgCodeThumbnailFormatExtension[BgCodeThumbnailFormats.PNG],
        data: data,
      };

    case BgCodeThumbnailFormats.JPG:
      return {
        extension: BgCodeThumbnailFormatExtension[BgCodeThumbnailFormats.JPG],
        data: data,
      };

    case BgCodeThumbnailFormats.QOI:
      const pngData = convertQoiToPng(data);
      return {
        extension: BgCodeThumbnailFormatExtension[BgCodeThumbnailFormats.PNG],
        data: pngData,
        converted: true,
      };

    default:
      throw new Error(`Unsupported thumbnail format: ${parameters.format}`);
  }
}
