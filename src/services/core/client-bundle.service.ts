import AdmZip from "adm-zip";
import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import { ensureDirExists, getMediaPath } from "@/utils/fs.utils";
import { checkVersionSatisfiesMinimum, getMaximumOfVersionsSafe } from "@/utils/semver.utils";
import { AppConstants } from "@/server.constants";
import { GithubService } from "@/services/core/github.service";
import { LoggerService } from "@/handlers/logger";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { compare } from "semver";
import { errorSummary } from "@/utils/error.utils";
import { ExternalServiceError, InternalServerException, NotFoundException } from "@/exceptions/runtime.exceptions";
import { RequestError } from "octokit";

type UpdateResponse = {
  shouldUpdate: boolean;
  requestedVersion: string | undefined;
  currentVersion: string | null;
  minimumVersion: string;
  targetVersion: string | null;
  reason: string;
};

export class ClientBundleService {
  private readonly logger: LoggerService;
  private readonly githubOwner = AppConstants.orgName;
  private readonly githubRepo = AppConstants.clientRepoName;
  private readonly minVersion = AppConstants.defaultClientMinimum;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly githubService: GithubService,
  ) {
    this.logger = loggerFactory(ClientBundleService.name);
  }

  get clientPackageJsonPath() {
    return join(getMediaPath(), AppConstants.defaultClientBundleStorage, "package.json");
  }

  get clientIndexHtmlPath() {
    return join(getMediaPath(), AppConstants.defaultClientBundleStorage, "dist/index.html");
  }

  async getReleases() {
    try {
      const [releases, latestRelease] = await Promise.all([
        this.githubService.getReleases(this.githubOwner, this.githubRepo),
        this.githubService.getLatestRelease(this.githubOwner, this.githubRepo),
      ]);

      return {
        minimum: { tag_name: this.minVersion },
        current: { tag_name: this.getClientVersion() },
        latest: latestRelease.data,
        releases: releases.data,
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
  ): Promise<UpdateResponse> {
    const clientAutoUpdate = AppConstants.enableClientDistAutoUpdateKey;
    const existingVersion = this.getClientVersion();
    minimumVersion ??= this.minVersion;

    // Auto-update check
    if (!clientAutoUpdate && !overrideAutoUpdate) {
      return this.createResponse(
        false,
        existingVersion,
        minimumVersion,
        requestedVersion,
        null,
        "Client auto-update disabled, skipping",
      );
    }

    // Client files existence check
    if (!existingVersion || !this.doesClientIndexHtmlExist()) {
      const reason = existingVersion ? "Client index.html could not be found" : "Client package.json does not exist";

      return this.createResponse(
        true,
        existingVersion,
        minimumVersion,
        requestedVersion,
        getMaximumOfVersionsSafe(minimumVersion, requestedVersion),
        `${reason}, downloading new release`,
      );
    }

    // Minimum version check
    const meetsMinimum = checkVersionSatisfiesMinimum(existingVersion, minimumVersion);
    if (!meetsMinimum) {
      return this.createResponse(
        true,
        existingVersion,
        minimumVersion,
        requestedVersion,
        getMaximumOfVersionsSafe(minimumVersion, requestedVersion),
        `Client version ${existingVersion} below minimum ${minimumVersion}, downloading new release`,
      );
    }

    // Handle requested version scenarios
    if (requestedVersion) {
      return this.evaluateRequestedVersion(existingVersion, minimumVersion, requestedVersion, allowDowngrade);
    }

    // Default case - already up to date
    return this.createResponse(
      false,
      existingVersion,
      minimumVersion,
      requestedVersion,
      getMaximumOfVersionsSafe(minimumVersion, requestedVersion),
      `Client already satisfies minimum version ${minimumVersion}`,
    );
  }

  async downloadClientUpdate(releaseTag: string): Promise<string> {
    // Get release info
    const result = await this.githubService.getReleaseByTag(this.githubOwner, this.githubRepo, releaseTag);
    const release = result.data;

    // Find asset
    const assetName = `dist-client-${release.tag_name}.zip`;
    const asset = release.assets.find((a) => a.name === assetName);
    if (!asset) {
      throw new NotFoundException(`Asset ${assetName} not found in release ${release.tag_name}`);
    }

    // Download and extract
    const zipPath = await this.downloadZip(asset.id, asset.name);
    await this.extractZip(zipPath);

    return release.tag_name;
  }

  private evaluateRequestedVersion(
    currentVersion: string,
    minimumVersion: string,
    requestedVersion: string,
    allowDowngrade?: boolean,
  ): UpdateResponse {
    // Check if requested version meets minimum
    if (compare(requestedVersion, minimumVersion) === -1) {
      return this.createResponse(
        false,
        currentVersion,
        minimumVersion,
        requestedVersion,
        requestedVersion,
        `Requested version ${requestedVersion} below minimum ${minimumVersion}, skipping`,
      );
    }

    // Compare with current version
    const versionComparison = compare(requestedVersion, currentVersion);

    if (versionComparison === 0) {
      // Same version
      return this.createResponse(
        false,
        currentVersion,
        minimumVersion,
        requestedVersion,
        requestedVersion,
        `Requested version ${requestedVersion} same as current, skipping`,
      );
    } else if (versionComparison === -1) {
      // Downgrade
      return this.createResponse(
        !!allowDowngrade,
        currentVersion,
        minimumVersion,
        requestedVersion,
        requestedVersion,
        allowDowngrade
          ? `Downgrading to ${requestedVersion} (above minimum ${minimumVersion})`
          : `Downgrade not allowed, skipping`,
      );
    } else {
      // Upgrade
      return this.createResponse(
        true,
        currentVersion,
        minimumVersion,
        requestedVersion,
        requestedVersion,
        `Upgrading from ${currentVersion} to ${requestedVersion}`,
      );
    }
  }

  private createResponse(
    shouldUpdate: boolean,
    currentVersion: string | null,
    minimumVersion: string,
    requestedVersion: string | undefined,
    targetVersion: string | null,
    reason: string,
  ): UpdateResponse {
    return {
      shouldUpdate,
      requestedVersion,
      currentVersion,
      minimumVersion,
      targetVersion,
      reason,
    };
  }

  private async downloadZip(assetId: number, assetName: string): Promise<string> {
    const assetResult = await this.githubService.requestAsset(this.githubOwner, this.githubRepo, assetId);

    const distZipPath = join(getMediaPath(), AppConstants.defaultClientBundleZipsStorage);
    ensureDirExists(distZipPath);

    const path = join(distZipPath, assetName);
    writeFileSync(path, Buffer.from(assetResult.data));
    this.logger.log(`Downloaded client ZIP to ${distZipPath}`);

    return path;
  }

  private async extractZip(zipPath: string): Promise<void> {
    const distPath = join(getMediaPath(), AppConstants.defaultClientBundleStorage);
    ensureDirExists(distPath);

    // Clear the directory
    this.logger.debug(`Clearing contents of ${distPath}`);
    for (const item of await readdir(distPath)) {
      const itemPath = join(distPath, item);
      await rm(itemPath, { force: true, recursive: true }).catch((e) =>
        this.logger.error(`Failed to remove ${itemPath}: ${e.message}`),
      );
    }

    // Extract the zip
    try {
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(distPath);
      this.logger.log(`Successfully extracted client to ${distPath}`);
    } catch (e: any) {
      this.logger.error(`Extraction failed: ${e.message}`);
      throw e;
    }
  }

  private doesClientIndexHtmlExist(): boolean {
    return existsSync(this.clientIndexHtmlPath);
  }

  private getClientVersion(): string | null {
    const path = this.clientPackageJsonPath;
    if (!existsSync(path)) {
      return null;
    }

    try {
      const json = JSON.parse(readFileSync(path, "utf-8"));
      return json?.version ?? null;
    } catch {
      return null;
    }
  }
}
