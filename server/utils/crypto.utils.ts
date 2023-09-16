const bcrypt = require("bcryptjs");

/**
 * @param {string} password
 */
function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

/**
 * @param {string} password
 * @param {string} passwordHash
 * @return {boolean} comparison result
 */
function comparePasswordHash(password, passwordHash) {
  if (!password?.length) return false;
  return bcrypt.compareSync(password, passwordHash);
}

module.exports = {
  hashPassword,
  comparePasswordHash,
};
