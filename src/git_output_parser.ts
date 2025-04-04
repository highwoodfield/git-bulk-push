export function isCleanWorkingTree(output: string) {
    return output.endsWith("nothing to commit, working tree clean\n");
}

export function didPush(output: string) {
    output = output.replace("\r", "");
    return output.split("\n")
        .find((value, idx) => {
            return value !== "" && value !== "Everything up-to-date";
        }) !== undefined;
}