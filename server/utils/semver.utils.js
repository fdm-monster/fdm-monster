const { compare } = require("semver");

/**
 *
 * @param {string} newVersion
 * @param {string} minimumVersion
 * @returns {boolean}
 */
function checkVersionSatisfiesMinimum(newVersion, minimumVersion) {
  const comparison = compare(newVersion, minimumVersion);
  // Values 0 or 1 mean the client version is less than the minimum and should be force updated
  return comparison > -1;
}

module.exports = {
  checkVersionSatisfiesMinimum,
};
