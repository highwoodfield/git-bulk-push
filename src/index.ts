#!/usr/bin/env node
import * as os from "os";
import * as fs from "fs/promises";
import * as process from "process";
import * as path from "path";
import * as child_process from "child_process";
import * as util from "util";
import {EOL} from "node:os";

const execFile = util.promisify(child_process.execFile)

main().catch((err) => { console.error(err) });

interface Settings {
    targetPaths: string[];
}

async function main() {
    console.log("----- GIT-BULK-PUSH -----" + EOL);
    const settingsPath = path.join(os.homedir(), ".git-bulk-push.json");
    const settings: Settings = JSON.parse((await fs.readFile(settingsPath)).toString());

    for (const tgtPath of settings.targetPaths) {
        info("Checking: " + tgtPath);

        for await (const p of lsDirs(tgtPath)) {
            const isRepo = await isGitRepo(p);
            const not = isRepo ? " " : " NOT ";
            info(`${path.basename(p)} ... is${not}a git repo`);

            if (isRepo) {
                try {
                    await processRepo(p);
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }
}

async function processRepo(repoPath: string) {
    process.chdir(repoPath);
    const status = await execute("git", ["status"]);
    if (status.startsWith("On branch main\nYour branch is up to date with")) {
        info(path.basename(repoPath) + ": UP TO DATE");
        return;
    }
    await execute("git", ["add", "."]);
    await execute("git", [
        "commit",
        "-m",
        new Date().toLocaleString(),
        "-m",
        "by git-bulk-push",
    ]);
    await execute("git", ["push"]);
}

async function execute(file: string, args: string[]) {
    const logPrefix = path.basename(process.cwd());
    try {
        info(logPrefix + ": ==================");
        info(`${logPrefix}: ${file},${args.join(",")}`);
        const {stdout, stderr} = await execFile(file, args);
        if (stdout.length !== 0) {
            //info(logPrefix + ": STDOUT: " + EOL + stdout);
        }
        if (stderr.length !== 0) {
            err(logPrefix + ": STDERR: "  + EOL + stderr);
        }
        return stdout;
    } catch (error) {
        throw error;
    }
}

async function isGitRepo(tgtDir: string) {
    for await (const ent of lsDirs(tgtDir)) {
        if (path.basename(ent) === ".git") return true;
    }
    return false;
}

async function* lsDirs(tgtDir: string) {
    for (const ent of (await fs.readdir(tgtDir))) {
        const entPath = path.join(tgtDir, ent);
        const stats = await fs.lstat(entPath);
        if (stats.isDirectory()) {
            yield entPath;
        }
    }
}

function err(message: string) {
    console.error("[ERROR] " + message);
}

function info(message: string) {
    console.info("[INFO] " + message);
}

function debug(message: string) {
    console.debug("[DEBUG] " + message);
}