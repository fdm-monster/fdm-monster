const Logger = require("./logger");

function LoggerFactory(_) {
  return (name, logToFile, logLevel) => {
    return new Logger(name, logToFile, logLevel);
  };
}

module.exports = LoggerFactory;
