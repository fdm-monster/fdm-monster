import axios from "axios";

const key = "key";
const fileUrl = "FILE.gcode";

async function getFileMetadata(url: string) {
  try {
    const response = await axios.head(url, {
      headers: {
        "X-API-Key": key,
      },
    });
    return {
      contentLength: response.headers["content-length"],
      contentType: response.headers["content-type"],
      lastModified: response.headers["last-modified"],
    };
  } catch (error: any) {
    console.error("Error fetching file metadata:", error.message);
    return null;
  }
}

async function fetchGCodeMetadata(url: string, maxLines = 50) {
  try {
    const response = await axios.get(url, {
      headers: {
        // We can scan only a part of the file
        Range: "bytes=1900-2000",
        "X-API-Key": key,
      },
    });

    const lines = response.data.split("\n").slice(0, maxLines);
    return lines;
  } catch (error: any) {
    console.error("Error fetching file:", error.message);
    return [];
  }
}

fetchGCodeMetadata(fileUrl).then((metadata) => {
  console.log(metadata);
});
getFileMetadata(fileUrl).then((metadata) => {
  console.log(metadata);
});
