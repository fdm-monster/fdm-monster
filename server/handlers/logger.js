const winston = require("winston");
const { AppConstants } = require("../server.constants");

const dtFormat = new Intl.DateTimeFormat("en-GB", {
  timeStyle: "medium",
  dateStyle: "short",
  timeZone: "UTC"
});

dateFormat = () => {
  return dtFormat.format(new Date());
};

class LoggerService {
  constructor(name, enableFileLogs = true, logFilterLevel) {
    const isProd = process.env.NODE_ENV === AppConstants.defaultProductionEnv;
    const isTest = process.env.NODE_ENV === AppConstants.defaultTestEnv;

    if (!logFilterLevel) {
      logFilterLevel = isProd || isTest ? "warn" : "info";
    }

    this.name = name;
    this.logger = winston.createLogger({
      transports: [
        new winston.transports.Console({
          level: logFilterLevel
        }),
        ...(enableFileLogs
          ? [
              new winston.transports.File({
                level: isTest ? "warn" : "info", // Irrespective of environment
                filename: `./logs/${name}.log`,
                maxsize: "5000000",
                maxFiles: 5
              })
            ]
          : [])
      ],
      format: winston.format.printf((info) => {
        const level = info.level.toUpperCase();
        const date = dateFormat();
        let message = `${date} | ${level} | ${name} | ${info.message}`;
        message = info.meta ? message + ` - ${JSON.stringify(info.meta)}` : message;
        return message;
      })
    });
  }

  info(message, meta) {
    this.logger.log("info", message, {
      meta
    });
  }

  warning(message, meta) {
    this.logger.log("warn", message, {
      meta
    });
  }

  debug(message, meta) {
    this.logger.log("debug", message, {
      meta
    });
  }

  error(message, meta) {
    this.logger.log("error", message, { meta });
  }
}

module.exports = LoggerService;
