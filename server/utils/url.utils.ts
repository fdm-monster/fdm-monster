export function sanitizeURL(url: string) {
    if (!url)
        return;
    return new URL(url).href;
}

export function convertHttpUrlToWebsocket(url: string) {
    const urlInstance = new URL(url);
    const protocol = urlInstance.protocol;
    if (protocol === "https:") {
        urlInstance.protocol = "wss:";
    } else {
        urlInstance.protocol = "ws:";
    }
    return urlInstance.href;
}