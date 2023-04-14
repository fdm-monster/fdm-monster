const { AppConstants } = require("../server.constants");

class ClientBundleService {
  octokit;

  constructor({ octokitService }) {
    this.octokit = octokitService;
  }

  async downloadBundle() {
    const result = await this.octokit.rest.repos.getLatestRelease({
      owner: AppConstants.clientOrgName,
      repo: AppConstants.clientRepoName,
    });
    console.log(result);
  }
}

module.exports = {
  ClientBundleService,
};
