import AdmZip from "adm-zip";
import { join } from "path";
import { existsSync, writeFileSync } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import { ensureDirExists, superRootPath } from "@/utils/fs.utils";
import { checkVersionSatisfiesMinimum, getMaximumOfVersionsSafe } from "@/utils/semver.utils";
import { AppConstants } from "@/server.constants";
import { GithubService } from "@/services/core/github.service";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { compare } from "semver";
import { errorSummary } from "@/utils/error.utils";
import { ExternalServiceError, InternalServerException, NotFoundException } from "@/exceptions/runtime.exceptions";
import { RequestError } from "octokit";

export class ClientBundleService {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly githubService: GithubService,
  ) {
    this.logger = loggerFactory(ClientBundleService.name);
  }

  get clientPackageJsonPath() {
    return join(superRootPath(), AppConstants.defaultClientBundleStorage, "package.json");
  }

  get clientIndexHtmlPath() {
    return join(superRootPath(), AppConstants.defaultClientBundleStorage, "dist/index.html");
  }

  async getReleases() {
    const githubOwner = AppConstants.orgName;
    const githubRepo = AppConstants.clientRepoName;
    try {
      const result = await this.githubService.getReleases(githubOwner, githubRepo);
      const latestResult = await this.githubService.getLatestRelease(githubOwner, githubRepo);
      return {
        minimum: {
          tag_name: AppConstants.defaultClientMinimum,
        },
        current: {
          tag_name: this.getClientVersion(),
        },
        latest: latestResult.data,
        releases: result.data,
      };
    } catch (e) {
      if (e instanceof RequestError) {
        this.logger.error(`Github OctoKit error ${errorSummary(e)}`);
        throw new ExternalServiceError({ error: "Github OctoKit error: " + e.message }, "GitHub");
      }
      throw new InternalServerException("Something went wrong with the request to Github");
    }
  }

  async shouldUpdateWithReason(
    overrideAutoUpdate?: boolean,
    minimumVersion?: string,
    requestedVersion?: string,
    allowDowngrade?: boolean,
  ) {
    const clientAutoUpdate = AppConstants.enableClientDistAutoUpdateKey;

    const existingClientVersion = this.getClientVersion();
    if (!clientAutoUpdate && !overrideAutoUpdate) {
      return {
        shouldUpdate: false,
        requestedVersion,
        minimumVersion: AppConstants.defaultClientMinimum,
        currentVersion: existingClientVersion,
        targetVersion: null,
        reason: "Client auto-update disabled (ENABLE_CLIENT_DIST_AUTO_UPDATE), skipping",
      };
    }

    // If no package.json found, we should update to latest/minimum
    if (!existingClientVersion) {
      return {
        shouldUpdate: true,
        requestedVersion,
        currentVersion: existingClientVersion,
        minimumVersion: AppConstants.defaultClientMinimum,
        targetVersion: getMaximumOfVersionsSafe(minimumVersion, requestedVersion),
        reason: `Client package.json does not exist, downloading new release`,
      };
    }

    if (!this.doesClientIndexHtmlExist()) {
      return {
        shouldUpdate: true,
        requestedVersion,
        currentVersion: existingClientVersion,
        minimumVersion: AppConstants.defaultClientMinimum,
        targetVersion: getMaximumOfVersionsSafe(minimumVersion, requestedVersion),
        reason: `Client index.html could not be found, downloading new release`,
      };
    }

    const satisfiesMinimumVersion = checkVersionSatisfiesMinimum(existingClientVersion, minimumVersion);
    const clientOutdated = !satisfiesMinimumVersion;
    const clientOutdatedResponse = {
      shouldUpdate: true,
      requestedVersion,
      currentVersion: existingClientVersion,
      minimumVersion: AppConstants.defaultClientMinimum,
      targetVersion: getMaximumOfVersionsSafe(minimumVersion, requestedVersion),
      reason: `Client bundle release ${existingClientVersion} does not satisfy minimum version ${minimumVersion}, downloading new release`,
    };

    // If requestedVersion was specified, ensure above minimum and in case of downgrade whether thats allowed
    if (!!requestedVersion) {
      const minimumComparison = compare(requestedVersion, minimumVersion);
      if (minimumComparison === -1) {
        if (clientOutdated) return clientOutdatedResponse;
        return {
          shouldUpdate: false,
          requestedVersion,
          currentVersion: existingClientVersion,
          minimumVersion: AppConstants.defaultClientMinimum,
          targetVersion: requestedVersion,
          reason: `Requested version ${requestedVersion} is below minimum designed version ${minimumVersion}, skipping`,
        };
      }

      // We know requestedVersion is above minimum, so we should check if its above the existing version
      const newComparison = compare(requestedVersion, existingClientVersion);
      const isDowngrade = newComparison === -1;
      if (isDowngrade) {
        if (!allowDowngrade && clientOutdated) return clientOutdatedResponse;
        return {
          shouldUpdate: allowDowngrade,
          requestedVersion,
          currentVersion: existingClientVersion,
          minimumVersion: AppConstants.defaultClientMinimum,
          // Explicit downgrade is allowed, so we should return the requestedVersion
          targetVersion: requestedVersion,
          reason: allowDowngrade
            ? `Client bundle downgrade allowed (above ${minimumVersion}), downloading new release`
            : `Client bundle downgrade not allowed (even thought above ${minimumVersion}), skipping`,
        };
      } else if (newComparison === 1) {
        return {
          shouldUpdate: true,
          requestedVersion,
          currentVersion: existingClientVersion,
          minimumVersion: AppConstants.defaultClientMinimum,
          targetVersion: getMaximumOfVersionsSafe(minimumVersion, requestedVersion),
          reason: `Client bundle release ${requestedVersion} is above existing version ${existingClientVersion}, downloading updated release`,
        };
      }
    }

    // No requestedVersion was specified, so we should check if the existing version satisfies the minimum
    if (!satisfiesMinimumVersion) {
      return clientOutdatedResponse;
    }

    return {
      shouldUpdate: false,
      requestedVersion,
      currentVersion: existingClientVersion,
      minimumVersion: AppConstants.defaultClientMinimum,
      targetVersion: getMaximumOfVersionsSafe(minimumVersion, requestedVersion),
      reason: `Client already satisfies minimum version ${minimumVersion} and requested version is not an upgrade, skipping`,
    };
  }

  async downloadClientUpdate(releaseTag: string): Promise<string> {
    const release = await this.getClientBundleRelease(releaseTag);
    this.logger.log(
      `Retrieved ${release.assets.length} assets from release '${release.name}': ${release.assets.map((a) => a.name)}`,
    );

    const assetName = `dist-client-${release.tag_name}.zip`;
    const asset = release.assets.find((a) => a.name === assetName);
    if (!asset) {
      throw new NotFoundException(`Release with tag ${release.tag_name} asset ${assetName} does not exist`);
    }
    const assetId = asset?.id;
    const downloadPath = await this.downloadClientBundleZip(assetId, asset.name);
    await this.extractClientBundleZip(downloadPath);

    return release.tag_name;
  }

  private async getClientBundleRelease(releaseTag: string) {
    const githubOwner = AppConstants.orgName;
    const githubRepo = AppConstants.clientRepoName;

    const result = await this.githubService.getReleaseByTag(githubOwner, githubRepo, releaseTag);
    return result.data;
  }

  private async downloadClientBundleZip(assetId: any, assetName: string): Promise<string | any> {
    const githubOwner = AppConstants.orgName;
    const githubRepo = AppConstants.clientRepoName;

    const assetResult = await this.githubService.requestAsset(githubOwner, githubRepo, assetId);
    const dir = join(superRootPath(), AppConstants.defaultClientBundleZipsStorage);
    ensureDirExists(dir);
    this.logger.log(`Downloaded client release ZIP to '${dir}'. Extracting archive now`);
    const path = join(dir, assetName);
    writeFileSync(path, Buffer.from(assetResult.data));

    return path;
  }

  private async extractClientBundleZip(downloadedZipPath: string): Promise<void> {
    const distPath = join(superRootPath(), AppConstants.defaultClientBundleStorage);
    const zip = new AdmZip(downloadedZipPath);
    ensureDirExists(distPath);

    this.logger.debug(`Clearing contents of ${distPath}`);
    for (const fileOrDir of await readdir(distPath)) {
      this.logger.log(`Removing existing file/dir '${distPath}/${fileOrDir}' before updating client`);
      try {
        await rm(join(distPath, fileOrDir), { force: true, recursive: true });
      } catch (e: any) {
        this.logger.error(`${e.message} ${e.stack}`);
        throw e;
      }
    }

    try {
      zip.extractAllTo(join(superRootPath(), AppConstants.defaultClientBundleStorage));
    } catch (e: any) {
      this.logger.error(`Unzipping failed ${e.message} ${e.stack}`);
      throw e;
    }
    this.logger.log(`Successfully extracted client dist to ${distPath}`);
  }

  private doesClientIndexHtmlExist(): boolean {
    const indexHtmlPath = this.clientIndexHtmlPath;
    return existsSync(indexHtmlPath);
  }

  private getClientVersion(): string | null {
    const packageJsonPath = this.clientPackageJsonPath;
    const packageJsonFound = existsSync(packageJsonPath);
    // If no package.json found, we should update to latest/minimum
    if (!packageJsonFound) {
      return;
    }

    require.cache[packageJsonPath] = undefined;
    const json = require(packageJsonPath);
    return json?.version;
  }
}
