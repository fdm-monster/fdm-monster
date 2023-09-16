import simpleGit from "simple-git";
import { SimpleGit } from "simple-git/dist/typings/simple-git";

export class SimpleGitMock {
  currentScenario: string | null = null;
  isGitRepo = true;
  wasReset: boolean | null = null;
  wasPulled = false;
  wasForceReset = false;

  constructor() {}

  status() {
    return Promise.resolve(this.currentScenario);
  }

  fetch() {
    return Promise.resolve();
  }

  pull(force: boolean) {
    this.wasForceReset = force;
    this.wasPulled = true;
    return Promise.resolve();
  }

  reset = (input: any) => {
    this.wasReset = true;
    return Promise.resolve();
  };

  // Mock helper functions below
  checkIsRepo() {
    return this.isGitRepo;
  }

  testGetWasReset() {
    return this.wasReset;
  }

  getWasForceReset() {
    return this.wasForceReset;
  }

  getWasPulled() {
    return this.wasPulled;
  }

  setTestScenario(input: any) {
    this.currentScenario = input;
  }

  setIsRepo(isRepo: boolean) {
    this.isGitRepo = isRepo;
  }
}
