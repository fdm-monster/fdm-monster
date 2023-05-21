const { AppConstants } = require("../server.constants");
const AdmZip = require("adm-zip");
const { join } = require("path");
const { existsSync, writeFileSync } = require("node:fs");
const { readdir, rm } = require("node:fs/promises");
const { ensureDirExists, superRootPath } = require("../utils/fs.utils");
const { compare } = require("semver");

class ClientBundleService {
  octokit;
  configService;
  logger;

  constructor({ octokitService, configService, loggerFactory }) {
    this.octokit = octokitService;
    this.configService = configService;
    this.logger = loggerFactory("ClientBundleService");
  }

  get clientPackageJsonPath() {
    return join(superRootPath(), AppConstants.defaultClientBundleStorage, "package.json");
  }

  get clientIndexHtmlPath() {
    return join(superRootPath(), AppConstants.defaultClientBundleStorage, "dist/index.html");
  }

  async downloadBundle() {
    if (this.configService.get(AppConstants.GITHUB_PAT)?.length) {
      await this.octokit.rest.users.getAuthenticated();
      this.logger.log("Successfully authenticated to github using PersonalAccessToken (PAT)");
    }

    const owner = AppConstants.clientOrgName;
    const repo = AppConstants.clientRepoName;
    const result = await this.octokit.rest.repos
      .getLatestRelease({
        owner,
        repo,
      })
      .catch((e) => {
        throw new Error(`Could not find latest release of organization/repo ${owner}/${repo} (status: ${e.status})`);
      });

    const tag = result.data?.tag_name;
    const result2 = await this.octokit.rest.repos
      .getReleaseByTag({
        owner,
        repo,
        tag,
      })
      .catch((e) => {
        throw new Error(`Could not fetch specific release by tag ${tag}, client dist update failed (status: ${e.status})`);
      });

    // Check if github release is newest
    const release = result2.data;
    const releaseTag = release.tag_name;
    const needsBundleDownload = this.checkClientUpdatable(releaseTag);
    if (!needsBundleDownload) {
      this.logger.log(`Client bundle version is up to date with ${releaseTag}`);
      return;
    }

    const asset = release.assets.find((a) => a.name === `dist-client-${releaseTag}.zip`);
    const assetId = asset.id;
    const attachmentResult = await this.octokit.request("GET /repos/:owner/:repo/releases/assets/:asset_id", {
      headers: {
        Accept: "application/octet-stream",
      },
      owner,
      repo,
      asset_id: assetId,
    });

    // Store ZIP file in media zips folder
    const zipPath = join(superRootPath(), AppConstants.defaultClientBundleZipsStorage);
    ensureDirExists(zipPath);
    this.logger.log(`Downloaded client bundle release ZIP to '${zipPath}'. Extracting ZIP archive now`);
    const path = join(zipPath, asset.name);
    writeFileSync(path, Buffer.from(attachmentResult.data));

    // Extract ZIP archive to client bundle folder
    const clientBundlePath = join(superRootPath(), AppConstants.defaultClientBundleStorage);
    const zip = new AdmZip(path);
    ensureDirExists(clientBundlePath);

    this.logger.debug("Cleaning existing client bundle folder");
    await this.cleanClientDistFolder(clientBundlePath);

    try {
      await zip.extractAllTo(clientBundlePath);
    } catch (e) {
      this.logger.error(`Unzipping failed to complete ${e.message} ${e.stack}`);
    }
    this.logger.log(`Successfully extracted client bundle to ${clientBundlePath}`);
  }

  checkClientUpdatable(latestReleaseTag) {
    const packageJsonPath = this.clientPackageJsonPath;
    const foundClientPackageJson = existsSync(packageJsonPath);
    if (!foundClientPackageJson || !existsSync(this.clientIndexHtmlPath)) {
      return true;
    }

    // The client bundle was found, now check for updates
    const version = this.getCurrentClientVersion();
    const comparison = compare(version, latestReleaseTag);
    if (comparison > -1) {
      return false;
    }

    return true;
  }

  getCurrentClientVersion() {
    const packageJsonPath = this.clientPackageJsonPath;
    const { version } = require(packageJsonPath);
    return version;
  }

  async cleanClientDistFolder(distPath) {
    for (const fileOrDir of await readdir(distPath)) {
      try {
        await rm(join(distPath, fileOrDir), { force: true, recursive: true });
      } catch (e) {
        this.logger.error(`${e.message} ${e.stack}`);
        throw e;
      }
    }
  }
}

module.exports = {
  ClientBundleService,
};
