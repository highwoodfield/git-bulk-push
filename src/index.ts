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
            const repo = new Repository(p);
            const isRepo = await repo.isGitRepo();
            const not = isRepo ? " " : " NOT ";
            repo.info(`is${not}a git repo`);

            if (isRepo) {
                try {
                    await repo.processRepo();
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }
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
            info(logPrefix + ": STDERR: "  + EOL + stderr);
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

class Repository {
    path: string;

    constructor(path: string) {
        this.path = path;
    }

    isGitRepo() {
        return isGitRepo(this.path);
    }

    getName() {
        return path.basename(this.path);
    }

    info(message: string) {
        console.info(`[INFO] ${this.getName()}: ` + message);
    }

    async processRepo() {
        process.chdir(this.path);
        const status = await execute("git", ["status"]);
        if (status.endsWith("nothing to commit, working tree clean\n")) {
            info(path.basename(this.path) + ": UP TO DATE");
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
}