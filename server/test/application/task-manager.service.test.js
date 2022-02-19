import * as dbHandler from "../db-handler.js";
import container$0 from "../../container.js";
import DITokens from "../../container.tokens";
import job from "../../exceptions/job.exceptions";
const { configureContainer } = container$0;
const { JobValidationException } = job;
let container;
let taskManagerService;
beforeAll(async () => {
    await dbHandler.connect();
    container = configureContainer();
    taskManagerService = container.resolve(DITokens.taskManagerService);
});
describe("TaskManagerService", () => {
    it("should invalidate wrong task spec", () => {
        let caught = false;
        try {
            taskManagerService.validateInput();
        }
        catch (e) {
            expect(e instanceof JobValidationException).toBeTruthy();
            caught = true;
        }
        expect(caught).toEqual(true);
    });
    it("should invalidate nonexisting task spec", () => {
        let caught = false;
        try {
            taskManagerService.validateInput("name");
        }
        catch (e) {
            expect(e instanceof JobValidationException).toBeTruthy();
            caught = true;
        }
        expect(caught).toEqual(true);
    });
    it("should invalidate wrong workload - missing run", () => {
        let caught = false;
        try {
            taskManagerService.validateInput("name", () => { });
        }
        catch (e) {
            expect(e instanceof JobValidationException).toBeTruthy();
            caught = true;
        }
        expect(caught).toEqual(true);
    });
    it("should not run disabled periodic job", () => {
        let ran = false;
        taskManagerService.validateInput("name", () => {
            ran = true;
        }, {
            disabled: true,
            periodic: true,
            milliseconds: 1000
        });
        expect(ran).toBeFalsy();
    });
});
