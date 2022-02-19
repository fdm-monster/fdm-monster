import fs from "fs";
import octoprintService from "./constants/octoprint-service.constants";
import compatibility from "../../utils/compatibility.utils";
import api from "./utils/api.utils";
import FormData from "form-data";
import got from "got";
import event from "../../constants/event.constants";
import runtime from "../../exceptions/runtime.exceptions";
import OctoPrintRoutes from "./octoprint-api.routes";
const { contentTypeHeaderKey, apiKeyHeaderKey, multiPartContentType } = octoprintService;
const { checkPluginManagerAPIDeprecation } = compatibility;
const { processResponse, processGotResponse } = api;
const { uploadProgressEvent, uploadCompletionEvent } = event;
const { ExternalServiceError } = runtime;
class OctoPrintApiService extends OctoPrintRoutes {
    _httpClient;
    _eventEmitter2;
    _logger;
    constructor({ settingsStore, httpClient, loggerFactory, eventEmitter2 }) {
        super({ settingsStore });
        this._httpClient = httpClient;
        this._eventEmitter2 = eventEmitter2;
        this._logger = loggerFactory("OctoPrint-API-Service");
    }
    async login(printer, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiLogin);
        const response = await this._httpClient.post(url, {}, options);
        return processResponse(response, responseOptions);
    }
    async sendConnectionCommand(printer, commandData, responseOptions) {
        const { url, options, data } = this._prepareJsonRequest(printer, this.apiConnection, commandData);
        const response = await this._httpClient.post(url, data, options);
        return processResponse(response, responseOptions);
    }
    /**
     * Ability to start, cancel, restart, or pause a job
     * @param printer
     * @param commandData command: start, cancel, restart
     * @param responseOptions
     * @returns {Promise<*|{data: *, status: *}>}
     */
    async sendJobCommand(printer, commandData, responseOptions) {
        const { url, options, data } = this._prepareJsonRequest(printer, this.apiJob, commandData);
        const response = await this._httpClient.post(url, data, options);
        return processResponse(response, responseOptions);
    }
    async getSettings(printer, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiSettingsPart);
        const response = await this._httpClient.get(url, options);
        return processResponse(response, responseOptions);
    }
    async setGCodeAnalysis(printer, { enabled }, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiSettingsPart);
        const settingPatch = this.gcodeAnalysisSetting(enabled);
        const response = await this._httpClient.post(url, settingPatch, options);
        return processResponse(response, responseOptions);
    }
    async getAdminUserOrDefault(printer) {
        const data = await this.getUsers(printer);
        let opAdminUserName = "admin";
        if (!!data?.users && Array.isArray(data)) {
            const adminUser = data.users.find((user) => !!user.admin);
            if (!adminUser)
                opAdminUserName = adminUser.name;
        }
        return opAdminUserName;
    }
    async getUsers(printer, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiUsers);
        const response = await this._httpClient.get(url, options);
        return processResponse(response, responseOptions);
    }
    async getFiles(printer, recursive = false, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiGetFiles(recursive));
        const response = await this._httpClient.get(url, options);
        return processResponse(response, responseOptions);
    }
    async getFile(printer, path, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiFile(path));
        const response = await this._httpClient.get(url, options);
        return processResponse(response, responseOptions);
    }
    async createFolder(printer, path, foldername, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiFilesLocation);
        const formData = new FormData();
        formData.append("path", path);
        formData.append("foldername", foldername);
        const headers = {
            ...options.headers,
            ...formData.getHeaders(),
            "Content-Length": formData.getLengthSync()
        };
        const response = await this._httpClient.post(url, formData, {
            headers
        });
        return processResponse(response, responseOptions);
    }
    async moveFileOrFolder(printer, path, destination, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiFile(path));
        const command = this.moveFileCommand(destination);
        const response = await this._httpClient.post(url, command, options);
        return processResponse(response, responseOptions);
    }
    async selectPrintFile(printer, path, print, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiFile(path));
        const command = this.selectCommand(print);
        const response = await this._httpClient.post(url, command, options);
        return processResponse(response, responseOptions);
    }
    async uploadFileAsMultiPart(printer, fileStreamOrBuffer, commands, token, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiFilesLocation, null, multiPartContentType);
        const formData = new FormData();
        if (commands.select) {
            formData.append("select", "true");
        }
        if (commands.print) {
            formData.append("print", "true");
        }
        let source = fileStreamOrBuffer.buffer;
        const isPhysicalFile = !source;
        if (!source) {
            source = fs.createReadStream(fileStreamOrBuffer.path);
        }
        formData.append("file", source, { filename: fileStreamOrBuffer.originalname });
        try {
            const headers = {
                ...options.headers,
                ...formData.getHeaders()
            };
            const response = await got
                .post(url, {
                body: formData,
                headers
            })
                .on("uploadProgress", (p) => {
                if (token) {
                    this._eventEmitter2.emit(`${uploadProgressEvent(token)}`, token, p);
                }
            });
            // Cleanup
            if (isPhysicalFile) {
                fs.unlinkSync(fileStreamOrBuffer.path);
            }
            return await processGotResponse(response, responseOptions);
        }
        catch (e) {
            this._eventEmitter2.emit(`${uploadProgressEvent(token)}`, token, { failed: true }, e);
            let data;
            try {
                data = JSON.parse(e.response?.body);
            }
            catch {
                data = e.response?.body;
            }
            throw new ExternalServiceError({
                error: e.message,
                statusCode: e.response?.statusCode,
                data,
                success: false,
                stack: e.stack
            });
        }
    }
    async deleteFileOrFolder(printer, path, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiFile(path));
        const response = await this._httpClient.delete(url, options);
        return processResponse(response, responseOptions);
    }
    async getConnection(printer, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiConnection);
        const response = await this._httpClient.get(url, options);
        return processResponse(response, responseOptions);
    }
    async getPrinterProfiles(printer, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiPrinterProfiles);
        const response = await this._httpClient.get(url, options);
        return processResponse(response, responseOptions);
    }
    async getPluginManager(printer, responseOptions) {
        const printerManagerApiCompatible = checkPluginManagerAPIDeprecation(printer.octoPrintVersion);
        const path = printerManagerApiCompatible || !printer.octoPrintVersion
            ? this.apiPluginManagerRepository1_6_0
            : this.apiPluginManager;
        const { url, options } = this._prepareRequest(printer, path);
        const response = await this._httpClient.get(url, options);
        return processResponse(response, responseOptions);
    }
    async getSystemInfo(printer, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiSystemInfo);
        const response = await this._httpClient.get(url, options);
        return processResponse(response, responseOptions);
    }
    async getSystemCommands(printer, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiSystemCommands);
        const response = await this._httpClient.get(url, options);
        return processResponse(response, responseOptions);
    }
    async getSoftwareUpdateCheck(printer, force, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiSoftwareUpdateCheck(force));
        const response = await this._httpClient.get(url, options);
        return processResponse(response, responseOptions);
    }
    async getPluginPiSupport(printer, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiPluginPiSupport);
        const response = await this._httpClient.get(url, options);
        return processResponse(response, responseOptions);
    }
    async deleteTimeLapse(printer, fileName, responseOptions) {
        const path = `${this.apiTimelapse}/${fileName}`;
        const { url, options } = this._prepareRequest(printer, path);
        const response = await this._httpClient.delete(url, options);
        return processResponse(response, responseOptions);
    }
    async listUnrenderedTimeLapses(printer, responseOptions) {
        const path = `${this.apiTimelapse}?unrendered=true`;
        const { url, options } = this._prepareRequest(printer, path);
        const response = await this._httpClient.get(url, options);
        return processResponse(response, responseOptions);
    }
    async listProfiles(printer, responseOptions) {
        const { url, options } = this._prepareRequest(printer, this.apiProfiles);
        const response = await this._httpClient.get(url, options);
        return processResponse(response, responseOptions);
    }
    async downloadFile(printerConnection, fetchPath, targetPath, callback) {
        const fileStream = fs.createWriteStream(targetPath);
        // TODO
        const res = await this._httpClient.get(printerConnection, fetchPath, false);
        return await new Promise((resolve, reject) => {
            res.body.pipe(fileStream);
            res.body.on("error", reject);
            fileStream.on("finish", async () => {
                await callback(resolve, reject);
            });
        });
    }
    // TODO WIP
    async downloadImage({ printerURL, apiKey }, fetchPath, targetPath, callback) {
        // https://stackoverflow.com/questions/55374755/node-js-axios-download-file-stream-and-writefile
        const downloadURL = new URL(fetchPath, printerURL);
        return request.head(downloadURL, (err, res, body) => {
            res.headers[contentTypeHeaderKey] = "image/png";
            res.headers[apiKeyHeaderKey] = apiKey;
            request(downloadURL).pipe(fs.createWriteStream(targetPath)).on("close", callback);
        });
    }
}
export default OctoPrintApiService;
