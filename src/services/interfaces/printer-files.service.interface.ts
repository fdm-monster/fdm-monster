import { IdType } from "@/shared.constants";

export interface IPrinterFilesService<KeyType = IdType> {
  getPrinterFilesStorage(printerId: KeyType): Promise<{ storage: any; fileList: any }>;

  updateFiles(printerId: KeyType, fileList): Promise<any>;

  appendOrReplaceFile(printerId: KeyType, addedFile): Promise<{ lastPrintedFile: {}; fileList: any }>;

  setPrinterLastPrintedFile(printerId: KeyType, fileName: string): Promise<any>;

  clearFiles(printerId: KeyType): Promise<void>;

  /**
   * Perform delete action on database
   **/
  deleteFile(printerId: KeyType, filePath: string, throwError: boolean): Promise<void>;
}
