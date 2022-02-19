import multer from "multer";
import { AppConstants } from "../server.constants";
import path from "path";
import fs from "fs";
import runtime from "../exceptions/runtime.exceptions";
const { NotFoundException } = runtime;
class MulterService {
    #fileUploadTrackerCache;
    constructor({ fileUploadTrackerCache }) {
        this.#fileUploadTrackerCache = fileUploadTrackerCache;
    }
    clearUploadsFolder() {
        if (!fs.existsSync(AppConstants.defaultFileUploadFolder))
            return;
        fs.readdir(AppConstants.defaultFileUploadFolder, (err, files) => {
            if (err)
                throw err;
            for (const file of files) {
                fs.unlink(path.join(AppConstants.defaultFileUploadFolder, file), (err) => {
                    if (err)
                        throw err;
                });
            }
        });
    }
    gcodeFileFilter(req, file, callback) {
        const ext = path.extname(file.originalname);
        if (ext !== ".gcode") {
            return callback(new Error("Only .gcode files are allowed"));
        }
        callback(null, true);
    }
    getMulterGCodeFileFilter(storeAsFile = true) {
        return multer({
            storage: storeAsFile
                ? multer.diskStorage({
                    destination: AppConstants.defaultFileUploadFolder
                })
                : multer.memoryStorage(),
            fileFilter: this.gcodeFileFilter
        }).any();
    }
    startTrackingSession(multerFile) {
        return this.#fileUploadTrackerCache.addUploadTracker(multerFile);
    }
    getSessions() {
        return this.#fileUploadTrackerCache.getUploads();
    }
}
export default MulterService;
