import { compare } from "semver";

export function checkVersionSatisfiesMinimum(newVersion: string, minimumVersion: string) {
  const comparison = compare(newVersion, minimumVersion);
  // -1 => newVersion less than
  // 0 => newVersion equal to
  // 1 => newVersion greater than
  return comparison !== -1;
}

export function getMaximumOfVersionsSafe(v1: string, v2?: string) {
  if (!v2) return v1;
  const comparison = compare(v1, v2);
  if (comparison === 0) return v1;
  if (comparison === -1) return v2;
  return v1;
}
