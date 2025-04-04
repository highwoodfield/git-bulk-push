import * as assert from "assert";
import {deepStrictEqual} from "node:assert";
import * as parser from "./git_output_parser.js"

console.log("Testing: isCleanWorkTree");

const status_dirty = `On branch main
Your branch is ahead of 'origin/main' by 2 commits.
  (use "git push" to publish your local commits)

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/index.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        src/git_output_parser.ts
        src/test.ts

no changes added to commit (use "git add" and/or "git commit -a")
`;

const status_clean = `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
`;

assert.deepStrictEqual(parser.isCleanWorkingTree(status_dirty), false, "should be dirty");
assert.deepStrictEqual(parser.isCleanWorkingTree(status_clean), true, "should be clean");

console.log("Testing: didPush");

const push_none = `Everything up-to-date
Everything up-to-date
`;
const push_all = `Enumerating objects: 10, done.
Counting objects: 100% (10/10), done.
Delta compression using up to 16 threads
Compressing objects: 100% (7/7), done.
Writing objects: 100% (7/7), 692 bytes | 692.00 KiB/s, done.
Total 7 (delta 5), reused 0 (delta 0), pack-reused 0 (from 0)
To https://example.com
   167dfd2..0b0714a  main -> main
Enumerating objects: 10, done.
Counting objects: 100% (10/10), done.
Delta compression using up to 16 threads
Compressing objects: 100% (7/7), done.
Writing objects: 100% (7/7), 692 bytes | 692.00 KiB/s, done.
Total 7 (delta 5), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (5/5), completed with 3 local objects.
To https://example.com
   167dfd2..0b0714a  main -> main
`;
const push_some = `Everything up-to-date
Enumerating objects: 10, done.
Counting objects: 100% (10/10), done.
Delta compression using up to 16 threads
Compressing objects: 100% (7/7), done.
Writing objects: 100% (7/7), 692 bytes | 692.00 KiB/s, done.
Total 7 (delta 5), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (5/5), completed with 3 local objects.
To https://example.com
   167dfd2..0b0714a  main -> main
`;

deepStrictEqual(parser.didPush(push_none), false);
deepStrictEqual(parser.didPush(push_all), true);
deepStrictEqual(parser.didPush(push_some), true);

console.log("Tests have been finished")