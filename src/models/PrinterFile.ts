import { model, Schema } from "mongoose";
import { OctoPrintCustomDto } from "@/services/octoprint/dto/files/octoprint-file.dto";

export interface IPrinterFile {
  id: string;
  printerId: Schema.Types.ObjectId;
  name: string;
  date: number;
  // display: string;
  // gcodeAnalysis?: any;
  // hash: string;
  // origin: string;
  path: string;
  // prints?: any;
  // refs?: any;
  size?: number;
  // statistics?: any;
  // type?: string;
  // typePath?: string[];
  // customData?: OctoPrintCustomDto;
}

/**
 * @deprecated This schema will be removed and is unused right now.
 */
export const PrinterFileSchema = new Schema<IPrinterFile>({
  printerId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  date: {
    type: Number,
    required: true,
  },
  // display: {
  //   type: String,
  //   required: true,
  // },
  // gcodeAnalysis: {
  //   type: Object,
  //   default: null,
  //   required: false,
  // },
  // hash: {
  //   type: String,
  //   required: true,
  // },
  // origin: {
  //   type: String,
  //   required: true,
  // },
  path: {
    type: String,
    required: true,
  },
  // prints: {
  //   type: Object,
  //   required: false,
  // },
  // refs: {
  //   type: Object,
  //   required: false,
  // },
  size: {
    type: Number,
    required: false,
  },
  // statistics: {
  //   type: Object,
  //   required: false,
  // },
  // type: {
  //   type: String,
  //   required: false,
  // },
  // typePath: {
  //   type: Array(String),
  //   required: false,
  // },
  // customData: {
  //   type: Object,
  //   required: true,
  // },
});

export const PrinterFile = model("PrinterFile", PrinterFileSchema);
