const {
  jsonContentType,
  contentTypeHeaderKey
} = require("./octoprint/constants/octoprint-service.constants");
const { fdmGithubRepoUrl } = require("../constants/software-update.constants");
const GithubETag = require("../models/GithubETag");
const HttpStatusCode = require("../constants/http-status-codes.constants");

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
    this.#logger.log(`Received ${releases?.length || "?"} releases from github.`);
    return releases;
  }

  /**
   * Gets the releases of a certain GitHub repository
   * @param repoUrl
   * @param includePrereleases (default: false) include unstable pre-releases
   * @returns {Promise<*>}
   */
  async getRepoGithubReleases(repoUrl, includePrereleases = false) {
    const foundEtag = await GithubETag.findOne({
      repoUrl
    });

    const optionalHeader = foundEtag ? { "If-None-Match": foundEtag.etag } : {};
    const response = await this.#httpClient
      .get(`${repoUrl}/releases`, {
        headers: {
          [contentTypeHeaderKey]: jsonContentType,
          ...(optionalHeader || {})
        }
      })
      .catch((e) => {
        if (e.response.status === HttpStatusCode.NOT_MODIFIED) {
          return { data: foundEtag.cachedResponse, isCached: true };
        }
        throw e;
      });

    // Cache the response including pre-releases for later re-use
    const etag = response?.headers?.etag;
    if (!!etag && !!response?.isCached) {
      await GithubETag.updateOne(
        { repoUrl },
        { repoUrl, etag, cachedResponse: response.data },
        {
          new: true,
          upsert: true
        }
      );
    }

    let releases = response?.data;
    if (!includePrereleases) {
      releases = this.#filterPreReleases(releases);
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
