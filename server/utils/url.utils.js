const { normalizeUrl } = require("./normalize-url");

function httpToWsUrl(url, protocol = "ws") {
  const wsUrl = new URL("/sockjs/websocket", normalizeUrl(url));
  wsUrl.protocol = `${protocol}`;
  wsUrl.pathname = "/sockjs/websocket";
  return wsUrl;
}

module.exports = {
  httpToWsUrl,
};
