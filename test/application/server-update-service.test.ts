import { AwilixContainer } from "awilix";
import { ServerUpdateService } from "@/services/server-update.service";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";

jest.mock("child_process", () => {
  return {
    exec: () => Promise.resolve(),
    execSync: () => Promise.resolve(),
  };
});
jest.mock("simple-git");
import { SimpleGit } from "simple-git";

describe("ServerUpdateService", () => {
  let container: AwilixContainer;
  let serverUpdateService: ServerUpdateService;
  let mockedSimpleGit: SimpleGit;

  beforeAll(() => {
    container = configureContainer();
    serverUpdateService = container.resolve(DITokens.serverUpdateService);
    mockedSimpleGit = container.resolve(DITokens.simpleGitService);
  });

  describe("package updates, modifications and pull", () => {
    const scenarioModifiedOutput = {
      modified: ["package-lock.json", "package.json", "src/index.js"],
      ahead: 0,
      behind: 0,
    };

    const scenarioModifiedBehindOutput = {
      modified: ["package-lock.json", "package.json", "src/index.js"],
      ahead: 0,
      behind: 1,
    };

    const scenarioModifiedAheadOutput = {
      modified: ["package-lock.json", "package.json", "src/index.js"],
      ahead: 1,
      behind: 0,
    };

    const scenarioAheadOutput = {
      modified: [],
      ahead: 1,
      behind: 0,
    };

    const scenarioBehindOutput = {
      modified: [],
      ahead: 0,
      behind: 1,
    };

    const scenarioUpToDate = {
      modified: [],
      ahead: 0,
      behind: 0,
    };

    const scenarioOutcomes = [
      {
        name: "modified files",
        scenario: scenarioModifiedOutput,
      },
      {
        name: "modified files behind",
        scenario: scenarioModifiedBehindOutput,
      },
      {
        name: "ahead",
        scenario: scenarioAheadOutput,
      },
      {
        name: "modified files ahead",
        scenario: scenarioModifiedAheadOutput,
      },
      {
        name: "behind",
        scenario: scenarioBehindOutput,
      },
    ];

    beforeEach(() => {
      mockedSimpleGit.setTestScenario(scenarioUpToDate);
      mockedSimpleGit.setIsRepo(true);
    });

    it("should be able to detect no updates", async () => {
      mockedSimpleGit.setTestScenario(scenarioUpToDate);
      const updateState = await serverUpdateService.checkGitUpdates();
      expect(updateState?.commitsBehind).toEqual(scenarioUpToDate.behind);
    });

    it("should be able to complete when behind in commits", async () => {
      mockedSimpleGit.setTestScenario(scenarioBehindOutput);
      const updateState = await serverUpdateService.checkGitUpdates();
      expect(updateState?.commitsBehind).toEqual(scenarioBehindOutput.behind);
    });

    it("should be able to request and see that we have a git repo", async () => {
      mockedSimpleGit.setIsRepo(true);
      const isRepo = mockedSimpleGit.checkIsRepo();
      expect(isRepo).toBe(true);
    });

    it("should fail on not being a git repo", async () => {
      mockedSimpleGit.setIsRepo(false);
      let error = null;
      await serverUpdateService.checkGitUpdates().catch((e) => (error = e));
      expect(error).not.toBeNull();
    });

    for (const spec of scenarioOutcomes) {
      it(spec.name, async () => {
        mockedSimpleGit.setTestScenario(spec.scenario);
        const updateState = await serverUpdateService.checkGitUpdates();
      });
    }
  });

  describe("Reboot command", () => {
    it("should not reboot FDM in unknown mode", async () => {
      await serverUpdateService.restartServer().catch((e) => {
        expect(e.message).toBe("Restart requested, but no daemon was available to perform this action");
      });
    });

    it("should be able to attempt rebooting FDM - pm2 mode", async () => {
      // Output indicates that we are in pm2 mode
      process.env.PM2_HOME = "true";
      const outputPm2 = await serverUpdateService.restartServer();
      expect(outputPm2).toBe(true);
      delete process.env.PM2_HOME;
    });

    it("should be able to attempt rebooting FDM - nodemon mode", async () => {
      // Output indicates that we are in nodemon mode
      process.env.npm_lifecycle_script = "something something nodemon";
      const outputNodemon = await serverUpdateService.restartServer();
      expect(outputNodemon).toBe(true);
      delete process.env.npm_lifecycle_script;
    });
  });
});
