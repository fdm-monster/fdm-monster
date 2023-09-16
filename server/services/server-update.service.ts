import { isNodemon, isPm2 } from "@/utils/env.utils";
import { AppConstants } from "@/server.constants";
import { execSync } from "child_process";
import { InternalServerException, ValidationException } from "@/exceptions/runtime.exceptions";
import { LoggerService } from "@/handlers/logger";
import { PullResult, SimpleGit } from "simple-git";

export class ServerUpdateService {
  private simpleGitService: SimpleGit;
  private logger: LoggerService;

  constructor({ simpleGitService, loggerFactory }) {
    this.simpleGitService = simpleGitService;
    this.logger = loggerFactory(ServerUpdateService.name);
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
    let isValidGitRepo = this.simpleGitService.checkIsRepo();
    if (!isValidGitRepo) {
      throw new ValidationException("Server update could not proceed as the server had no .git repository folder");
    }

    await this.simpleGitService.fetch();
    const localRepoStatus = await this.simpleGitService.status();

    if (!localRepoStatus) return;

    const result = {
      gitFolderFound: true,
      updateCheckSuccess: true,
      commitsBehind: localRepoStatus.behind,
      commitsAhead: localRepoStatus.ahead,
      filesModified: localRepoStatus.modified?.length,
      status: "",
      pullStatus: null as PullResult | null,
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

    this.logger.warn("Pulling git to get the latest server updates");

    const pullDetails = await this.simpleGitService.pull();
    result.status = "Pull action completed";
    result.pullStatus = pullDetails;
    return result;
  }
}
