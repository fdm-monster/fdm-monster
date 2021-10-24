const {
  jsonContentType,
  contentTypeHeaderKey
} = require("./octoprint/constants/octoprint-service.constants");

class GithubApiService {
  #httpClient;
  #logger;

  constructor({ httpClient, loggerFactory }) {
    this.#httpClient = httpClient;
    this.#logger = loggerFactory("Github-API", false);
  }

  async getGithubReleasesPromise() {
    const connected = await this.#httpClient
      .get("https://google.com", {
        headers: { [contentTypeHeaderKey]: jsonContentType }
      })
      .then(() => true)
      .catch(() => false);

    if (!connected) {
      return Promise.resolve(null);
    }

    return await this.#httpClient
      .get("https://api.github.com/repos/3d-hub/3d-hub/releases", {
        headers: {
          [contentTypeHeaderKey]: jsonContentType
        }
      })
      .then((r) => {
        this.#logger.info(`Received ${r.data.length} releases from github.`);
        return r.data;
      });
  }
}

module.exports = GithubApiService;
