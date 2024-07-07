import { IPrinterApi, OctoprintType, PrinterType } from "@/services/printer-api.interface";
import { LoginDto } from "@/services/interfaces/login.dto";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { NotImplementedException } from "@/exceptions/runtime.exceptions";

export class OctoprintApi implements IPrinterApi {
  client: OctoprintClient;
  printerLogin: LoginDto;
  constructor({ octoprintClient, printerLogin }: { octoprintClient: OctoprintClient; printerLogin: LoginDto }) {
    this.client = octoprintClient;
    this.printerLogin = printerLogin;
  }

  get type(): PrinterType {
    return OctoprintType;
  }

  set login(login: LoginDto) {
    this.printerLogin = login;
  }

  get login() {
    return this.printerLogin;
  }

  async getVersion() {
    const result = await this.client.getApiVersion(this.login);
    return result.data?.server;
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

  async startPrint(path: string) {
    await this.client.postSelectPrintFile(this.login, path, true);
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

  async getFiles() {
    const files = await this.client.getLocalFiles(this.login, false);
    return files.map((f) => ({
      name: f.name,
      path: f.path,
      size: f.size,
      date: f.date,
    }));
  }

  async downloadFile(path: string) {
    return await this.client.downloadFile(this.login, path);
  }

  async uploadFile(fileOrBuffer: Buffer | Express.Multer.File, uploadToken?: string) {
    await this.client.uploadFileAsMultiPart(this.login, fileOrBuffer, { select: true, print: true }, uploadToken);
  }

  async deleteFile(path: string) {
    await this.client.deleteFileOrFolder(this.login, path);
  }
  async deleteFolder(path: string) {
    await this.client.deleteFileOrFolder(this.login, path);
  }
}
