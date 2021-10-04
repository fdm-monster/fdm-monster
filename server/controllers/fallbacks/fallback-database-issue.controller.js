const path = require("path");
const mongoose = require("mongoose");
const Logger = require("../../handlers/logger.js");
const ServerSettingsDB = require("../../models/ServerSettings");
const isDocker = require("is-docker");
const envUtils = require("../../utils/env.utils");
const { validateMongoURL } = require("../../handlers/validators");
const { AppConstants } = require("../../app.constants");
const { fetchMongoDBConnectionString } = require("../../app-env");

const { createController } = require("awilix-express");

class FallbackIssueController {
  #serverVersion;
  #serverPageTitle;

  #systemCommandsService;

  #logger = new Logger("Server");

  constructor({ serverVersion, serverPageTitle, systemCommandsService }) {
    this.#serverVersion = serverVersion;
    this.#serverPageTitle = serverPageTitle;
    this.#systemCommandsService = systemCommandsService;
  }

  async restartServer(req, res) {
    let serviceRestarted = false;
    try {
      serviceRestarted = await this.#systemCommandsService.restartServer();
    } catch (e) {
      this.#logger.error(e);
    }
    res.send(serviceRestarted);
  }

  async testConnection(res, req) {
    const body = req.body;
    const connectionURL = body.connectionURL;

    if (!connectionURL || !validateMongoURL(connectionURL)) {
      res.statusCode = 400;
      return res.send({
        connectionURL,
        reason: "Not a valid connection string",
        succeeded: false
      });
    }

    let connSucceeded = false;
    this.#logger.info("Testing database with new URL");
    await mongoose.disconnect();
    await mongoose
      .connect(connectionURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        serverSelectionTimeoutMS: 2500
      })
      .then((r) => {
        connSucceeded = !!r;
      })
      .catch((r) => {
        connSucceeded = false;
      });

    if (!connSucceeded) {
      res.statusCode = 400;
      return res.send({
        connectionURL,
        reason: "Could not connect",
        succeeded: connSucceeded
      });
    }

    return await ServerSettingsDB.find({})
      .then((r) => {
        return res.send({
          connectionURL,
          succeeded: connSucceeded
        });
      })
      .catch((e) => {
        connSucceeded = false;
        if (e.message.includes("command find requires authentication")) {
          return res.send({
            connectionURL,
            reason:
              "MongoDB connected just fine, but you should check your authentication (username/password)",
            succeeded: connSucceeded
          });
        } else {
          return res.send({
            connectionURL,
            reason: e.message,
            succeeded: connSucceeded
          });
        }
      });
  }

  async saveConnectionEnv(req, res) {
    if (isDocker()) {
      res.statusCode = 500;
      return res.send({
        reason: `The 3DPF docker container cannot change this setting. Change the ${AppConstants.MONGO_KEY} variable yourself.`,
        succeeded: false
      });
    }

    const body = req.body;
    const connectionURL = body.connectionURL;
    if (!connectionURL || !validateMongoURL(connectionURL)) {
      res.statusCode = 400;
      return res.send({
        connectionURL,
        reason: "Not a valid connection string",
        succeeded: false
      });
    }

    try {
      envUtils.writeVariableToEnvFile(
        path.join(__dirname, "../../.env"),
        AppConstants.MONGO_KEY,
        connectionURL
      );
    } catch (e) {
      res.statusCode = 500;
      return res.send({
        reason: e.message,
        succeeded: false
      });
    }

    this.#logger.info(`Saved ${AppConstants.MONGO_KEY} env variable to .env file`);

    if (envUtils.isNodemon()) {
      res.send({
        reason: `Succesfully saved ${AppConstants.MONGO_KEY} environment variable to .env file. Please restart 3DPF Server manually!`,
        succeeded: true
      });
    } else {
      res.send({
        reason: `Succesfully saved ${AppConstants.MONGO_KEY} environment variable to .env file. Restarting 3DPF Server, please start it again if that fails!`,
        succeeded: true
      });
    }
  }
}

// prettier-ignore
module.exports = createController(FallbackIssueController)
  .prefix("/")
  .get("", "index")
  .post("restart-server", "restartServer")
  .post("save-connection-env", "saveConnectionEnv")
  .post("test-connection", "testConnection");
