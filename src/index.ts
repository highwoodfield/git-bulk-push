#!/usr/bin/env node
import { EOL } from "os";
import * as fs from "fs/promises";
import * as process from "process";
import * as path from "path";
import * as child_process from "child_process";
import * as util from "util";

const execFile = util.promisify(child_process.execFile)

main().catch((err) => { console.error(err) });

async function main() {
    console.log("----- GIT-BULK-PUSH -----" + EOL);
    for await (const p of lsDirs(path.resolve(process.cwd(), "../git-bulk-push-test"))) {
        const isRepo = await isGitRepo(p);
        const not = isRepo ? " " : " NOT ";
        info(`${path.basename(p)}\t... is${not}a git repo`);

        if (isRepo) await processRepo(p);
    }
}

async function processRepo(repoPath: string) {
    process.chdir(repoPath);
    try {
        await execute("git", ["add", "."]);
        await execute("git", [
            "commit",
            "-m",
            new Date().toLocaleString(),
            "-m",
            "by git-bulk-push",
        ]);
        await execute("git", ["push"]);
    } catch (err) {
        console.error(err);
    }
}

async function execute(file: string, args: string[]) {
    try {
        info("==================");
        info(`${file},${args.join(",")}`);
        const {stdout, stderr} = await execFile(file, args);
        if (stdout.length !== 0) {
            info("STDOUT: " + EOL + stdout);
        }
        if (stderr.length !== 0) {
            err("STDERR: "  + EOL + stderr);
        }
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