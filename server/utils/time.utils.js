async function sleep(ms = 2000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  sleep
};
