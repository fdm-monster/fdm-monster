const mongoose = require("mongoose");
const { AppConstants } = require("../server.constants");
const { printerFileCleanSettingKey } = require("../constants/server-settings.constants");

const ServerSettingsSchema = new mongoose.Schema({
  onlinePolling: {
    seconds: {
      type: String,
      default: "0.5",
      required: true
    }
  },
  [printerFileCleanSettingKey]: {
    autoRemoveOldFilesBeforeUpload: {
      type: Boolean,
      default: false,
      required: true
    },
    autoRemoveOldFilesAtBoot: {
      type: Boolean,
      default: false,
      required: true
    },
    autoRemoveOldFilesCriteriumDays:  {
      type: Number,
      default: 14,
      required: true
    }
  },
  server: {
    uploadFolder: {
      type: String,
      default: AppConstants.defaultFileStorageFolder
    },
    port: {
      type: Number,
      default: AppConstants.defaultServerPort,
      required: true
    },
    loginRequired: {
      type: Boolean,
      default: false,
      required: true
    },
    registration: {
      type: Boolean,
      default: true,
      required: true
    }
  },
  timeout: {
    apiTimeout: {
      type: Number,
      default: 1000,
      required: true
    },
    apiRetryCutoff: {
      type: Number,
      default: 10000,
      required: true
    },
    apiRetry: {
      type: Number,
      default: 30000,
      required: true
    },
    webSocketRetry: {
      type: Number,
      default: 5000,
      required: true
    }
  },
  history: {
    snapshot: {
      onComplete: {
        type: Boolean,
        default: false,
        required: true
      },
      onFailure: {
        type: Boolean,
        default: false,
        required: true
      }
    },
    thumbnails: {
      onComplete: {
        type: Boolean,
        default: false,
        required: true
      },
      onFailure: {
        type: Boolean,
        default: false,
        required: true
      }
    },
    timelapse: {
      onComplete: {
        type: Boolean,
        default: false,
        required: true
      },
      onFailure: {
        type: Boolean,
        default: false,
        required: true
      },
      deleteAfter: {
        type: Boolean,
        default: false,
        required: true
      }
    }
  },
  influxExport: {
    active: {
      type: Boolean,
      default: false,
      required: true
    },
    host: {
      type: String
    },
    port: {
      type: String
    },
    database: {
      type: String
    },
    username: {
      type: String
    },
    password: {
      type: String
    },
    retentionPolicy: {
      defaultRet: {
        type: Boolean
      }
    }
  }
});

const ServerSettings = mongoose.model("ServerSettings", ServerSettingsSchema);

module.exports = ServerSettings;
