import { NotFoundException } from "../exceptions/runtime.exceptions";

/**
 * @typedef { import("octokit").Octokit } Octokit
 */

export class GithubService {
  /**
   * @type {Octokit}
   */
  octokitService;
  /**
   * @type {LoggerService}
   */
  logger;

  constructor({ loggerFactory, octokitService }) {
    this.logger = loggerFactory("GithubService", false);
    this.octokitService = octokitService;
  }

  async wasAuthenticated() {
    const result = await this.octokitService.auth();
    return result?.type === "token";
  }

  async getLatestRelease(/**string**/ owner, /**string**/ repo) {
    return await this.octokitService.rest.repos
      .getLatestRelease({
        owner,
        repo,
      })
      .catch((e) => {
        if (e.name === "HttpError" && e.status == 404) {
          throw new NotFoundException(`Could not retrieve latest release`);
        }

        throw e;
      });
  }

  async getReleases(/**string**/ owner, /**string**/ repo) {
    return await this.octokitService.rest.repos
      .listReleases({
        owner,
        repo,
      })
      .catch((e) => {
        if (e.name === "HttpError" && e.status == 404) {
          throw new NotFoundException(`Could not retrieve releases`);
        }

        throw e;
      });
  }

  async getReleaseByTag(/**string**/ owner, /**string**/ repo, /**string**/ tag) {
    return await this.octokitService.rest.repos
      .getReleaseByTag({
        owner,
        repo,
        tag,
      })
      .catch((e) => {
        if (e.name === "HttpError" && e.status == 404) {
          throw new NotFoundException(`Could not find release with tag ${tag}`);
        }

        throw e;
      });
  }

  async requestAsset(/**string**/ owner, /**string**/ repo, /**any*/ assetId) {
    return await this.octokitService
      .request("GET /repos/:owner/:repo/releases/assets/:asset_id", {
        headers: {
          Accept: "application/octet-stream",
        },
        owner,
        repo,
        asset_id: assetId,
      })
      .catch((e) => {
        if (e.name === "HttpError" && e.status == 404) {
          throw new NotFoundException(`Could not find asset with id ${assetId}`);
        }

        throw e;
      });
  }
}
