import { Octokit } from "octokit";

describe("Octokit ESM Compatibility", () => {
  it("should create Octokit instance", () => {
    const octokit = new Octokit();
    expect(octokit).toBeDefined();
    expect(octokit.rest).toBeDefined();
  });

  it("should handle API methods", async () => {
    const octokit = new Octokit();

    expect(typeof octokit.rest.repos.get).toBe("function");
    expect(typeof octokit.rest.users.getByUsername).toBe("function");
  });

  it("should work with our existing GithubService pattern", () => {
    const octokit = new Octokit({
      auth: undefined,
      throttle: {
        onRateLimit: () => true,
        onSecondaryRateLimit: () => true,
      },
    });

    expect(octokit).toBeDefined();
  });
});
