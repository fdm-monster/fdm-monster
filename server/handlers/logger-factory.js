import Logger from "./logger.js";

function LoggerFactory(_) {
    return (name, logToFile, logLevel) => {
        return new Logger(name, logToFile, logLevel);
    };
}

export default LoggerFactory;
