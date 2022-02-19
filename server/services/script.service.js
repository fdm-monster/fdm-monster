import Logger from "../handlers/logger.js";
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

    async wol(wolSettings) {
        const opts = {
            address: wolSettings.ip,
            num_packets: wolSettings.count,
            interval: wolSettings.interval,
            port: wolSettings.port
        };
        const mac = wolSettings.MAC;
        wol.wake(mac, function (error) {
            if (error) {
                logger.error("Couldn't fire wake packet", error);
            } else {
                logger.info("Successfully fired wake packet: ", mac, opts);
            }
        });
    }
}

export default ScriptService;
