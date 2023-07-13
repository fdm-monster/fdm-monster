async function sleep(ms = 2000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
}

module.exports = {
  sleep,
  isValidDate,
};
