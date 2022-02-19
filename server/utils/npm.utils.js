import util from "util";
import { type exec$0 } from "child_process";
const exec = util.promisify({ exec: exec$0 }.exec);
async function returnListOfMissingPackages() {
    try {
        const outdatedPackageJsonList = await exec("npm outdated --production --json");
        const outdatedPackageListParsed = JSON.parse(outdatedPackageJsonList.stdout);
        if (outdatedPackageListParsed) {
            const keys = Object.keys(outdatedPackageListParsed);
            const missingPackageList = [];
            keys.forEach((key, index) => {
                if (!outdatedPackageListParsed[key].current) {
                    missingPackageList.push(key);
                }
            });
            return missingPackageList;
        }
    }
    catch (e) {
        throw `Error running npm outdated command | ${e}`;
    }
}
async function installNpmDependency(dependency) {
    try {
        await exec(`npm install ${dependency}`);
    }
    catch (e) {
        throw `Error running installation command | ${e}`;
    }
}
export { returnListOfMissingPackages };
export { installNpmDependency };
export default {
    returnListOfMissingPackages,
    installNpmDependency
};
