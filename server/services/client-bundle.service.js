const { AppConstants } = require("../server.constants");
const AdmZip = require("adm-zip");
const { join } = require("path");
const { existsSync, writeFileSync } = require("node:fs");
const { readdir, rm } = require("node:fs/promises");
const { ensureDirExists, superRootPath } = require("../utils/fs.utils");
const { checkVersionSatisfiesMinimum } = require("../utils/semver.utils");

class ClientBundleService {
  githubService;
  configService;
  logger;

  constructor({ githubService, configService, loggerFactory }) {
    this.githubService = githubService;
    this.configService = configService;
    this.logger = loggerFactory("ClientBundleService");
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
  }

  /**
   *
   * @param {boolean} overrideAutoUpdate
   * @param {string} minimumVersion
   * @returns {Promise<{reason: string, shouldUpdate: boolean}>}
   */
  async shouldUpdateWithReason(overrideAutoUpdate, minimumVersion) {
    const clientAutoUpdate = AppConstants.enableClientDistAutoUpdateKey;
    if (!clientAutoUpdate && !overrideAutoUpdate) {
      return {
        shouldUpdate: false,
        reason: "Client auto-update disabled (ENABLE_CLIENT_DIST_AUTO_UPDATE), skipping",
      };
    }

    const version = this.getClientVersion();
    // If no package.json found, we should update to latest/minimum
    if (!version) {
      return {
        shouldUpdate: true,
        reason: `Client package.json does not exist, downloading new release`,
      };
    }

    if (!this.doesClientIndexHtmlExist()) {
      return {
        shouldUpdate: true,
        reason: `Client index.html does not exist, downloading new release`,
      };
    }

    // If no bundle found, this task should run to ensure one is downloaded
    const satisfiesMinimumVersion = checkVersionSatisfiesMinimum(version, minimumVersion);
    if (satisfiesMinimumVersion) {
      return {
        shouldUpdate: false,
        reason: `Client satisfies minimum version ${minimumVersion}, skipping`,
      };
    }

    return {
      shouldUpdate: true,
      reason: `Client bundle release ${version} does not satisfy minimum version ${minimumVersion}, downloading new release`,
    };
  }

  /**
   * @param {string} releaseTag
   * @returns {Promise<void>}
   */
  async downloadClientUpdate(releaseTag) {
    const release = await this.getClientBundleRelease(releaseTag);
    this.logger.log(
      `Retrieved ${release.assets.length} assets from release '${release.name}': ${release.assets.map((a) => a.name)}`
    );

    const asset = release.assets.find((a) => a.name === `dist-client-${release.tag_name}.zip`);
    const assetId = asset.id;
    const downloadPath = await this.downloadClientBundleZip(assetId, asset.name);
    await this.extractClientBundleZip(downloadPath);
  }

  /**
   * @private
   * @param {string} releaseTag
   * @returns {Promise<{data:any}>}
   */
  async getClientBundleRelease(releaseTag) {
    const githubOwner = AppConstants.orgName;
    const githubRepo = AppConstants.clientRepoName;

    const result = await this.githubService.getReleaseByTag(githubOwner, githubRepo, releaseTag);
    return result.data;
  }

  /**
   * @private
   * @param {any} assetId
   * @param {string} assetName
   * @returns {Promise<string | *>}
   */
  async downloadClientBundleZip(assetId, assetName) {
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

  /**
   * @private
   * @param {string} downloadedZipPath
   * @returns {Promise<void>}
   */
  async extractClientBundleZip(downloadedZipPath) {
    const zip = new AdmZip(downloadedZipPath);

    const distPath = join(superRootPath(), AppConstants.defaultClientBundleStorage);
    ensureDirExists(distPath);

    this.logger.debug(`Clearing contents of ${distPath}`);
    for (const fileOrDir of await readdir(distPath)) {
      this.logger.log(`Removing existing file/dir '${distPath}/${fileOrDir}' before updating client`);
      try {
        await rm(join(distPath, fileOrDir), { force: true, recursive: true });
      } catch (e) {
        this.logger.error(`${e.message} ${e.stack}`);
        throw e;
      }
    }
    try {
      zip.extractAllTo(join(superRootPath(), AppConstants.defaultClientBundleStorage));
    } catch (e) {
      this.logger.error(`Unzipping failed ${e.message} ${e.stack}`);
      throw e;
    }
    this.logger.log(`Successfully extracted client dist to ${distPath}`);
  }

  /**
   * @private
   * @returns {boolean}
   */
  doesClientIndexHtmlExist() {
    const indexHtmlPath = this.clientIndexHtmlPath;
    return existsSync(indexHtmlPath);
  }

  /**
   * @private
   * @returns {?string}
   */
  getClientVersion() {
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

module.exports = {
  ClientBundleService,
};
