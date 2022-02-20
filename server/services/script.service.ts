import Logger from "../handlers/logger";
import {exec} from "child_process";

const logger = new Logger("Server-Scripts");

class ScriptService {
    async execute(scriptLocation, message) {
        logger.info("Executing script: ", scriptLocation);
        logger.info("Message: ", message);
        try {
            const {stdout, stderr} = await exec(`${scriptLocation} ${message}`);
            logger.info("stdout:", stdout);
            logger.info("stderr:", stderr);
            return scriptLocation + ": " + stdout;
        } catch (err) {
            logger.error(err);
            return err;
        }
    }
}

export default ScriptService;
