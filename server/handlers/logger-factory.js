const LoggerService = require("./logger");

function LoggerFactory(_) {
  return (name, logToFile, logLevel) => {
    return new LoggerService(name, logToFile, logLevel);
  };
}

module.exports = LoggerFactory;
