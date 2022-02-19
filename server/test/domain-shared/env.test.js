import envUtils from "../../utils/env.utils";
import path from "path";
describe("NODE_ENV", () => {
    it("environment should be test", () => {
        expect(process.env.NODE_ENV).toBe("test");
    });
});
describe("Env util package.json check", () => {
    it("should pass validation", () => {
        expect(envUtils.verifyPackageJsonRequirements(__dirname)).toEqual(false);
        expect(envUtils.verifyPackageJsonRequirements(path.join(__dirname, "mock-data"))).toEqual(true);
    });
});
