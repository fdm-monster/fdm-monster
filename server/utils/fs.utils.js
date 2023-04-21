const { existsSync, mkdirSync } = require("node:fs");
const { join } = require("path");

function superRootPath() {
  return join(__dirname, "../..");
}

function rootPath() {
  return join(__dirname, "..");
}

function ensureDirExists(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

module.exports = {
  ensureDirExists,
  superRootPath,
  rootPath,
};
