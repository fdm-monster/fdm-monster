const fetch = require("node-fetch");
const {
  jsonContentType,
  contentTypeHeaderKey
} = require("./octoprint/constants/octoprint-service.constants");

class GithubApiService {
  #httpClient;

  constructor({ httpClient }) {
    this.#httpClient = httpClient;
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
      .get("https://api.github.com/repos/davidzwa/3d-print-farm/releases", {
        headers: {
          [contentTypeHeaderKey]: jsonContentType
        }
      })
      .then((r) => {
        console.log(`Received ${r.data.length} releases from github.`);
        return r.data;
      });
  }
}

module.exports = GithubApiService;
