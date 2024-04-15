import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { Octokit } from "octokit";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class GithubService {
  octokitService: Octokit;
  logger: LoggerService;

  constructor({ loggerFactory, octokitService }: { loggerFactory: ILoggerFactory; octokitService: Octokit }) {
    this.logger = loggerFactory(GithubService.name, false);
    this.octokitService = octokitService;
  }

  async wasAuthenticated() {
    const result = await this.octokitService.auth();
    return result?.type === "token";
  }

  async getLatestRelease(owner: string, repo: string) {
    try {
      return await this.octokitService.rest.repos.getLatestRelease({
        owner,
        repo,
      });
    } catch (e) {
      if (e?.name === "HttpError" && e.status == 404) {
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
    } catch (e) {
      if (e?.name === "HttpError" && e.status == 404) {
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
      .catch((e) => {
        if (e.name === "HttpError" && e.status == 404) {
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
      .catch((e) => {
        if (e.name === "HttpError" && e.status == 404) {
          throw new NotFoundException(`Could not find asset with id ${assetId}`);
        }

        throw e;
      });
  }
}
