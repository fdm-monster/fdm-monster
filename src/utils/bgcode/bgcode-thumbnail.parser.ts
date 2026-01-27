import {
  BgCodeThumbnailFormats,
  BgCodeThumbnailParameters,
  BgCodeThumbnailFormatExtension
} from "./bgcode.types";
import { decodeQOI } from "./qoi-decoder";
import { encodePNG } from "./png-encoder";

export interface ThumbnailProcessResult {
  extension: string;
  data: Buffer;
  converted?: boolean;
}

export function processThumbnail(data: Buffer, parameters: BgCodeThumbnailParameters): ThumbnailProcessResult {
  switch (parameters.format) {
    case BgCodeThumbnailFormats.PNG:
      return {
        extension: BgCodeThumbnailFormatExtension[BgCodeThumbnailFormats.PNG],
        data: data
      };

    case BgCodeThumbnailFormats.JPG:
      return {
        extension: BgCodeThumbnailFormatExtension[BgCodeThumbnailFormats.JPG],
        data: data
      };

    case BgCodeThumbnailFormats.QOI:
      const decoded = decodeQOI(data);
      const pngData = encodePNG(decoded.width, decoded.height, decoded.data);
      return {
        extension: BgCodeThumbnailFormatExtension[BgCodeThumbnailFormats.PNG],
        data: pngData,
        converted: true
      };

    default:
      throw new Error(`Unsupported thumbnail format: ${parameters.format}`);
  }
}
