import axios from "axios";
import fs from "fs";
import path from "path";

interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
}

const fetchReleases = async () => {
  try {
    const response = await axios.get<Release[]>("https://api.github.com/repos/fdm-monster/fdm-monster-client-next/releases");
    const releases = response.data;

    // Filter relevant information from each release
    const releaseData = releases.map((release) => ({
      tag_name: release.tag_name,
      name: release.name,
      published_at: release.published_at,
      body: release.body,
    }));

    // Write data to a JSON file
    const outputPath = path.join(__dirname, "github-releases-client-slim-oct-2024.data.json");
    fs.writeFileSync(outputPath, JSON.stringify(releaseData, null, 2));
    console.log(`Releases data written to ${outputPath}`);
  } catch (error) {
    console.error("Error fetching releases:", error);
  }
};

const fetchLatest = async () => {
  try {
    const response = await axios.get<Release>(
      "https://api.github.com/repos/fdm-monster/fdm-monster-client-next/releases/latest",
    );
    const release = response.data;

    // Filter relevant information from each release
    const releaseData = {
      tag_name: release.tag_name,
      name: release.name,
      published_at: release.published_at,
      body: release.body,
    };

    // Write data to a JSON file
    const outputPath = path.join(__dirname, "github-releases-latest-client-slim.data.json");
    fs.writeFileSync(outputPath, JSON.stringify(releaseData, null, 2));
    console.log(`Releases data written to ${outputPath}`);
  } catch (error) {
    console.error("Error fetching releases:", error);
  }
};

fetchReleases();
fetchLatest();
