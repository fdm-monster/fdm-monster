import simpleGit from "simple-git";
import {ResetMode} from "simple-git/dist/src/lib/tasks/reset";

const git = simpleGit();

export function makeSureBranchIsUpToDateWithRemote() {
    return git.fetch();
}

export function checkIfWereInAGitRepo() {
    return git.checkIsRepo();
}

export function returnCurrentGitStatus() {
    return git.status();
}

export function isBranchUpToDate(status) {
    return status.behind === 0;
}

export function isBranchInfront(status) {
    return status.ahead !== 0;
}

export function getListOfModifiedFiles(status) {
    return status.modified;
}

export async function pullLatestRepository(force) {
    if (force) {
        await git.reset(ResetMode.HARD);
        return git.pull();
    } else {
        return git.pull();
    }
}