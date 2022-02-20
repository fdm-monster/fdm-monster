import Logger from "./logger";

function LoggerFactory(_) {
    return (name, logToFile, logLevel) => {
        return new Logger(name, logToFile, logLevel);
    };
}

export default LoggerFactory;
