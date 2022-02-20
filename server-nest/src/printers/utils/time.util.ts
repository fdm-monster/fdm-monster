export function toTimeFormat(printTime: number): string {
    if (!printTime) {
        return "?";
    }

    printTime = printTime * 1000;
    const h = Math.floor(printTime / 1000 / 60 / 60);
    const m = Math.floor((printTime / 1000 / 60 / 60 - h) * 60);
    return `${h}:${m}`;
}
