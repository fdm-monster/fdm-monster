import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { Octokit, RequestError } from "octokit";

export class GithubService {

  constructor(
    private readonly octokitService: Octokit,
  ) {
  }

  async wasAuthenticated() {
    const result = (await this.octokitService.auth()) as { type: string };
    return result?.type === "token";
  }

  async getRateLimit() {
    return this.octokitService.rest.rateLimit.get();
  }

  async getLatestRelease(owner: string, repo: string) {
    try {
      return await this.octokitService.rest.repos.getLatestRelease({
        owner,
        repo,
      });
    } catch (e: any) {
      if (e instanceof RequestError && e.status === 404) {
        throw new NotFoundException(`Could not find latest release`);
      }

      throw e;
    }
  }

  async getReleases(owner: string, repo: string) {
    try {
      return await this.octokitService.rest.repos.listReleases({
        owner,
        repo,
      });
    } catch (e: any) {
      if (e instanceof RequestError && e.status === 404) {
        throw new NotFoundException(`Could not find releases`);
      }

      throw e;
    }
  }

  async getReleaseByTag(owner: string, repo: string, tag: string) {
    return await this.octokitService.rest.repos
      .getReleaseByTag({
        owner,
        repo,
        tag,
      })
      .catch((e: any) => {
        if (e instanceof RequestError && e.status === 404) {
          throw new NotFoundException(`Could not find release with tag ${tag}`);
        }

        throw e;
      });
  }

  async requestAsset(owner: string, repo: string, assetId: any) {
    return await this.octokitService
      .request("GET /repos/:owner/:repo/releases/assets/:asset_id", {
        headers: {
          Accept: "application/octet-stream",
        },
        owner,
        repo,
        asset_id: assetId,
      })
      .catch((e: any) => {
        if (e instanceof RequestError && e.status === 404) {
          throw new NotFoundException(`Could not find asset with id ${assetId}`);
        }

        throw e;
      });
  }
}
