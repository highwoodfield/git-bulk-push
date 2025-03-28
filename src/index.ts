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

    process.chdir(os.homedir());

    for (const tgtPath of settings.targetPaths) {
        info("Checking: " + tgtPath);

        for await (const p of lsDirs(tgtPath)) {
            const repo = new Repository(p);
            const isRepo = await repo.isGitRepo();
            const not = isRepo ? "" : " NOT ";
            info(`${not}a git repo`);

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
    try {
        info(": ==================");
        info(`${file},${args.join(",")}`);
        const {stdout, stderr} = await execFile(file, args);
        if (stdout.length !== 0) {
            info("BEGIN STDOUT: =====");
            stdout.split("\n").forEach((line) => { info(line); });
            info("END STDOUT: =======")
        }
        if (stderr.length !== 0) {
            info("BEGIN STDERR: =====");
            stderr.split("\n").forEach((line) => { info(line); });
            info("END STDERR: =======")
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
    log("error", message);
}

function info(message: string) {
    log("info", message);
}

function debug(message: string) {
    log("debug", message);
}

type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, message: string) {
    const cwdName = path.basename(process.cwd());
    info(`[${level}] ${cwdName}: ${message}`);
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

    async isCleanWorkingTree() {
        const status = await execute("git", ["status"]);
        return status.endsWith("nothing to commit, working tree clean\n");
    }

    async processRepo() {
        process.chdir(this.path);
        const isCleanWT = await this.isCleanWorkingTree();

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

class ProcessResult {
    readonly pushed: boolean;
    readonly committed: boolean;

    constructor(pushed: boolean, committed: boolean) {
        this.pushed = pushed;
        this.committed = committed;
    }
}