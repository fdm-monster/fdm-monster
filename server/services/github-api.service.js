const {
  jsonContentType,
  contentTypeHeaderKey
} = require("./octoprint/constants/octoprint-service.constants");
const { fdmGithubRepoUrl } = require("../constants/software-update.constants");

class GithubApiService {
  #httpClient;
  #logger;

  constructor({ httpClient, loggerFactory }) {
    this.#httpClient = httpClient;
    this.#logger = loggerFactory("Github-API", false);
  }

  async getFDMGithubReleases(includePrereleases = false) {
    const connected = await this.#httpClient
      .get("https://google.com", {
        headers: { [contentTypeHeaderKey]: jsonContentType }
      })
      .then(() => true)
      .catch(() => false);

    if (!connected) {
      return;
    }

    const releases = await this.getRepoGithubReleases(fdmGithubRepoUrl, includePrereleases);
    this.#logger.info(`Received ${releases.length} releases from github.`);
    return releases;
  }

  /**
   * Gets the releases of a certain GitHub repository
   * @param repoUrl
   * @param includePrereleases (default: false) include unstable pre-releases
   * @returns {Promise<*>}
   */
  async getRepoGithubReleases(repoUrl, includePrereleases = false) {
    const response = await this.#httpClient.get(`${repoUrl}/releases`, {
      headers: {
        [contentTypeHeaderKey]: jsonContentType
      }
    });

    if (!response?.data?.length) return;

    const releases = response?.data;
    if (!includePrereleases) {
      return this.#filterPreReleases(releases);
    }

    return releases;
  }

  #filterPreReleases(releases, includePrereleases = false) {
    return releases?.filter(
      (r) => (r.draft === false && r.prerelease === false) || includePrereleases
    );
  }
}

module.exports = GithubApiService;
