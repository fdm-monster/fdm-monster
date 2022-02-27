const Logger = require("../handlers/logger.js");
const semver = require("semver");

class ServerUpdateService {
  #includingPrerelease = null; // env bool
  #airGapped = null; // Connection error
  #installedReleaseFound = null;
  #updateAvailable = null;

  #latestRelease = null;
  #installedRelease = null;

  #logger = new Logger("Server-SoftwareUpdateChecker");
  #serverVersion;
  #githubApiService;

  constructor({ serverVersion, githubApiService }) {
    this.#serverVersion = serverVersion;
    this.#githubApiService = githubApiService;
  }

  getState() {
    return {
      includingPrerelease: this.#includingPrerelease,
      airGapped: this.#airGapped,
      latestRelease: this.#latestRelease,
      installedRelease: this.#installedRelease,
      serverVersion: this.#serverVersion,
      installedReleaseFound: this.#installedReleaseFound,
      updateAvailable: this.#updateAvailable
    };
  }

  getAirGapped() {
    return this.#airGapped;
  }

  #filterPreReleases(releases, includePrereleases = false) {
    return releases.filter(
      (r) => (r.draft === false && r.prerelease === false) || includePrereleases
    );
  }

  #findLatestRelease(releases) {
    return releases.reduce((a, b) => {
      return new Date(a.created_at) > new Date(b.created_at) ? a : b;
    });
  }

  #findReleaseByTag(releases, tagName) {
    if (!tagName) return null;

    return releases.find((r) => r.tag_name?.replace("v", "") === tagName);
  }

  #transformGithubRelease(release) {
    delete release.body;
    delete release.author;
    return release;
  }

  /**
   * Connection-safe acquire data about the installed and latest released FDM versions.
   * @param includePrereleases
   * @returns {Promise<*|null>}
   */
  async syncLatestRelease(includePrereleases = false) {
    const allGithubReleases = await this.#githubApiService.getGithubReleases();
    const githubReleases = this.#filterPreReleases(allGithubReleases, includePrereleases);

    // Connection timeout results in airGapped state
    this.#airGapped = !allGithubReleases;
    this.#includingPrerelease = includePrereleases;
    if (!githubReleases?.length) {
      this.#logger.warning("Latest release check failed because releases from github empty");
      return;
    }

    // Illegal response should not store the latestRelease
    const currentlyInstalledRelease = this.#findReleaseByTag(githubReleases, this.#serverVersion);
    if (!currentlyInstalledRelease?.tag_name) {
      this.#logger.warning("Latest release check failed because latestRelease 'tag_name' not set");
      return;
    }

    this.#installedRelease = this.#transformGithubRelease(currentlyInstalledRelease);
    this.#latestRelease = this.#transformGithubRelease(this.#findLatestRelease(githubReleases));

    this.#installedReleaseFound = !!currentlyInstalledRelease;
    // If the installed release is unknown/unstable, no update should be triggered
    const lastTagIsNewer = semver.gt(this.#latestRelease.tag_name, this.#installedRelease.tag_name, true);
    this.#updateAvailable = this.#installedReleaseFound && lastTagIsNewer;
  }

  /**
   * Logs whether a firmware update is ready
   */
  logServerVersionState() {
    const latestReleaseState = this.getState();
    const latestRelease = latestReleaseState?.latestRelease;
    const latestReleaseTag = latestRelease?.tag_name?.replace("v", "");

    if (!latestReleaseTag) {
      // Tests only, silence it
      return;
    }

    const packageVersion = this.#serverVersion;
    if (!this.#installedReleaseFound) {
      this.#logger.info(
        `\x1b[36mVersion not detected as release.\x1b[0m
    Here's github's latest released: \x1b[32m${latestReleaseTag}\x1b[0m
    Here's your release tag: \x1b[32mv${packageVersion}\x1b[0m
    Thanks for using FDM Monster!`
      );
      return;
    }

    if (!!packageVersion && packageVersion !== latestReleaseTag) {
      if (!!this.#airGapped) {
        this.#logger.warning(
          `Installed release: ${packageVersion}. Skipping update check (air-gapped/disconnected from internet)`
        );
      } else {
        this.#logger.info(
          `Update available! New version: ${latestReleaseTag} (prerelease: ${latestRelease.prerelease})`
        );
      }
    } else if (!packageVersion) {
      return this.#logger.error(
        "Cant check release as package.json version environment variable is not set. Make sure FDM Server is run from a 'package.json' or NPM context."
      );
    } else {
      return this.#logger.info(`Installed release: ${packageVersion}. You are up to date!`);
    }
  }
}

module.exports = ServerUpdateService;
