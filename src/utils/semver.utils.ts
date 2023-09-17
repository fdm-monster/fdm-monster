import { compare } from "semver";

export function checkVersionSatisfiesMinimum(newVersion: string, minimumVersion: string): boolean {
  const comparison = compare(newVersion, minimumVersion);
  // Values 0 or 1 mean the client version is less than the minimum and should be force updated
  return comparison > -1;
}
