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

  async getGithubReleases() {
    const connected = await this.#httpClient
      .get("https://google.com", {
        headers: { [contentTypeHeaderKey]: jsonContentType }
      })
      .then(() => true)
      .catch(() => false);

    if (!connected) {
      return;
    }

    const response = await this.#httpClient.get(
      "https://api.github.com/repos/3d-hub/3d-hub/releases",
      {
        headers: {
          [contentTypeHeaderKey]: jsonContentType
        }
      }
    );

    if (!response?.data?.length) return;

    this.#logger.info(`Received ${response.data.length} releases from github.`);
    return response.data;
  }
}

module.exports = GithubApiService;
