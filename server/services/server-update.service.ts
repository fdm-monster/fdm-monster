const { isPm2, isNodemon } = require("../utils/env.utils");
const { AppConstants } = require("../server.constants");
const { execSync } = require("child_process");
const { InternalServerException, ValidationException } = require("../exceptions/runtime.exceptions");

export class ServerUpdateService {
  #simpleGitService;
  /**
   * @type {LoggerService}
   */
  #logger;

  constructor({ simpleGitService, loggerFactory }) {
    this.#simpleGitService = simpleGitService;
    this.#logger = loggerFactory("ServerUpdateService");
  }

  async restartServer() {
    if (!isPm2() && !isNodemon()) {
      // No daemon/overlay to trigger restart
      throw new InternalServerException("Restart requested, but no daemon was available to perform this action");
    }

    if (isPm2()) {
      execSync(`pm2 restart ${AppConstants.pm2ServiceName}`, { timeout: 5000 });
      return true;
    } else if (isNodemon()) {
      execSync("echo '// Restart file for nodemon' > ./nodemon_restart_trigger.js", {
        timeout: 5000,
      });
      return true;
    }
  }

  async checkGitUpdates() {
    let isValidGitRepo = this.#simpleGitService.checkIsRepo();
    if (!isValidGitRepo) {
      throw new ValidationException("Server update could not proceed as the server had no .git repository folder");
    }

    await this.#simpleGitService.fetch();
    const localRepoStatus = await this.#simpleGitService.status();

    if (!localRepoStatus) return;

    const result = {
      gitFolderFound: true,
      updateCheckSuccess: true,
      commitsBehind: localRepoStatus.behind,
      commitsAhead: localRepoStatus.ahead,
      filesModified: localRepoStatus.modified?.length,
    };

    if (localRepoStatus?.behind === 0) {
      result.status = "No commits to pull";
      return result;
    }

    // Either something was not ignored properly or we are in unstable/dev mode
    if (localRepoStatus?.modified?.length > 0 || localRepoStatus.ahead !== 0) {
      result.status = "Files were modified or the repo was commits ahead - cannot pull safely";
      return result;
    }

    this.#logger.warn("Pulling git to get the latest server updates");

    const pullDetails = await this.#simpleGitService.pull();
    result.status = "Pull action completed";
    result.pullStatus = pullDetails;
    return result;
  }
}
