import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { Octokit } from "octokit";
import { LoggerService } from "@/handlers/logger";
import type { ILoggerFactory } from "@/handlers/logger-factory";

export class GithubService {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly octokitService: Octokit,
  ) {
    this.logger = loggerFactory(GithubService.name);
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
    } catch (e: any) {
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
