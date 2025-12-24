import { FirstTimeSetupController } from "@/controllers/first-time-setup.controller";
import supertest from "supertest";
import { setupTestApp } from "../test-server";
import { AppConstants } from "@/server.constants";
import { AwilixContainer } from "awilix";
import { DITokens } from "@/container.tokens";
import { SettingsStore } from "@/state/settings.store";
import { expectBadRequestError, expectForbiddenResponse, expectOkResponse } from "../extensions";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { ISettingsService } from "@/services/interfaces/settings.service.interface";
import { User } from "@/entities";
import { getDatasource } from "../typeorm.manager";
import TestAgent from "supertest/lib/agent";

let request: TestAgent<supertest.Test>;
let container: AwilixContainer;
let settingsService: ISettingsService;
let settingsStore: SettingsStore;

const validateWizardRoute = `${ AppConstants.apiRoute }/first-time-setup/validate`;
const completeSetupRoute = `${ AppConstants.apiRoute }/first-time-setup/complete`;

describe(FirstTimeSetupController.name, () => {
  const validateWizard = async (input: any) => await request.post(validateWizardRoute).send(input);
  const completeSetup = async (input: any) => await request.post(completeSetupRoute).send(input);
  const resetWizard = async () => {
    await settingsService.updateWizardSettings({
      wizardCompleted: false,
      wizardCompletedAt: null,
      wizardVersion: 0,
    });
    await settingsStore.loadSettings();
  };

  beforeAll(async () => {
    ({request, container} = await setupTestApp(true));
    settingsService = container.resolve<ISettingsService>(DITokens.settingsService);
    settingsStore = container.resolve<SettingsStore>(DITokens.settingsStore);
  });

  it("should succeed on validation", async () => {
    await resetWizard();
    expect(settingsStore.isWizardCompleted()).toBeFalsy();

    const response2 = await validateWizard({
      loginRequired: true,
      registration: true,
      rootUsername: "test1",
      rootPassword: "testtest",
    });
    expectOkResponse(response2);
  });

  it("should not call validation when wizard already completed", async () => {
    const userService = container.resolve<IUserService>(DITokens.userService);
    expect(await userService.listUsers()).toHaveLength(0);

    await resetWizard();
    const response = await completeSetup({
      loginRequired: true,
      registration: true,
      rootUsername: "test2",
      rootPassword: "testtest",
    });
    expectOkResponse(response);
    expect(settingsStore.isWizardCompleted()).toBeTruthy();

    const response2 = await validateWizard({
      loginRequired: true,
      registration: true,
      rootUsername: "test2",
      rootPassword: "testtest",
    });
    expectForbiddenResponse(response2);
  });

  it("should not call validation when username already exists", async () => {
    await resetWizard();
    const response = await completeSetup({
      loginRequired: true,
      registration: true,
      rootUsername: "test3",
      rootPassword: "testtest",
    });
    expectOkResponse(response);
    expect(settingsStore.isWizardCompleted()).toBeTruthy();

    await resetWizard();
    const response2 = await validateWizard({
      loginRequired: true,
      registration: true,
      rootUsername: "test3",
      rootPassword: "testtest",
    });
    expectBadRequestError(response2);
  });

  it("should complete first-time-setup", async () => {
    await resetWizard();
    expect(settingsStore.isWizardCompleted()).toBeFalsy();

    const response = await completeSetup({
      loginRequired: true,
      registration: true,
      rootUsername: "test4",
      rootPassword: "testtest",
    });
    expectOkResponse(response);
    expect(settingsStore.isWizardCompleted()).toBeTruthy();
  });

  it("should not complete first-time-setup twice", async () => {
    await resetWizard();
    expect(settingsStore.isWizardCompleted()).toBeFalsy();
    await getDatasource().getRepository(User).clear();

    const response = await completeSetup({
      loginRequired: true,
      registration: true,
      rootUsername: "test5",
      rootPassword: "testtest",
    });
    expectOkResponse(response);
    expect(settingsStore.isWizardCompleted()).toBeTruthy();
    const response2 = await completeSetup({
      loginRequired: true,
      registration: true,
      rootUsername: "test5",
      rootPassword: "testtest",
    });
    expectForbiddenResponse(response2);
  });
});
