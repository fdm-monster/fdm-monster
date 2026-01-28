import { IPrinterApi, OctoprintType, PrinterType, ReprintState, UploadFileInput, uploadFileInputSchema } from "@/services/printer-api.interface";
import { LoginDto } from "@/services/interfaces/login.dto";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { NotImplementedException } from "@/exceptions/runtime.exceptions";
import { AxiosPromise } from "axios";

export class OctoprintApi implements IPrinterApi {
  private readonly client: OctoprintClient;

  constructor(
    octoprintClient: OctoprintClient,
    private printerLogin: LoginDto,
  ) {
    this.client = octoprintClient;
  }

  get type(): PrinterType {
    return OctoprintType;
  }

  get login() {
    return this.printerLogin;
  }

  set login(login: LoginDto) {
    this.printerLogin = login;
  }

  async getVersion() {
    const result = await this.client.getApiVersion(this.login);
    return result.data?.server;
  }

  async validateConnection(): Promise<void> {
    await this.getVersion();
  }

  async connect() {
    await this.client.sendConnectionCommand(this.login, this.client.connectCommand);
  }

  async disconnect() {
    await this.client.sendConnectionCommand(this.login, this.client.disconnectCommand);
  }

  async restartServer() {
    await this.client.postServerRestartCommand(this.login);
  }

  async restartHost() {
    // TODO Needs investigation
    throw new NotImplementedException();
  }

  async restartPrinterFirmware() {
    // TODO Needs investigation
    throw new NotImplementedException();
  }

  async startPrint(filePath: string) {
    await this.client.postSelectPrintFile(this.login, filePath, true);
  }

  async pausePrint(): Promise<void> {
    await this.client.sendJobCommand(this.login, this.client.pauseJobCommand);
  }

  async resumePrint(): Promise<void> {
    await this.client.sendJobCommand(this.login, this.client.resumeJobCommand);
  }

  async cancelPrint(): Promise<void> {
    await this.client.sendJobCommand(this.login, this.client.cancelJobCommand);
  }

  async sendGcode(script: string): Promise<void> {
    await this.client.sendCustomGCodeCommand(this.login, script);
  }

  async quickStop(): Promise<void> {
    await this.client.sendCustomGCodeCommand(this.login, "M112");
  }

  async movePrintHead(amounts: { x?: number; y?: number; z?: number; speed?: number }) {
    await this.client.sendPrintHeadJogCommand(this.login, amounts);
  }

  async homeAxes(axes: { x?: boolean; y?: boolean; z?: boolean }) {
    await this.client.sendPrintHeadHomeCommand(this.login, axes);
  }

  async getFile(path: string) {
    return this.client.getFile(this.login, path);
  }

  async getFiles(recursive = true) {
    const files = await this.client.getLocalFiles(this.login, recursive);
    return files.map((f) => ({
      path: f.path,
      size: f.size,
      date: f.date,
    }));
  }

  async downloadFile(path: string): AxiosPromise<NodeJS.ReadableStream> {
    return await this.client.downloadFile(this.login, path);
  }

  async getFileChunk(path: string, startBytes: number, endBytes: number): AxiosPromise<string> {
    return await this.client.getFileChunk(this.login, path, startBytes, endBytes);
  }

  async uploadFile(input: UploadFileInput) {
    const validated = uploadFileInputSchema.parse(input);
    await this.client.uploadFileAsMultiPart(this.login, validated.stream, validated.fileName, validated.contentLength, validated.startPrint, validated.uploadToken);
  }

  async deleteFile(path: string) {
    await this.client.deleteFileOrFolder(this.login, path);
  }

  async deleteFolder(path: string) {
    await this.client.deleteFileOrFolder(this.login, path);
  }

  async getSettings() {
    const response = await this.client.getSettings(this.login);
    return response.data;
  }

  async getReprintState() {
    const connectedResponse = await this.client.getConnection(this.login);
    const connectionState = connectedResponse.data.current?.state;

    const selectedJobResponse = await this.client.getJob(this.login);
    const selectedJob = selectedJobResponse.data;

    const currentJobFile = selectedJob?.job?.file;
    if (!currentJobFile?.path) {
      return { connectionState, reprintState: ReprintState.NoLastPrint };
    }

    return {
      connectionState,
      file: currentJobFile,
      reprintState: ReprintState.LastPrintReady,
    };
  }
}
