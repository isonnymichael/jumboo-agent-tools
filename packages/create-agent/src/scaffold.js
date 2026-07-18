/**
 * Copy the template tree into the target directory, renaming the few files that
 * can't be stored under their real name inside an npm package, and replacing
 * `__TOKEN__` placeholders in file contents.
 */
import { readdir, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Files that ship under a safe name and are renamed on scaffold.
const RENAME = {
  "_package.json": "package.json",
  "_gitignore": ".gitignore",
  "_env.example": ".env.example",
};

function applyTokens(content, tokens) {
  let out = content;
  for (const [key, value] of Object.entries(tokens)) {
    out = out.split(key).join(value);
  }
  return out;
}

/** Recursively copy `srcDir` → `dstDir`, renaming + templating as it goes. */
export async function copyTemplate(srcDir, dstDir, tokens = {}) {
  await mkdir(dstDir, { recursive: true });
  for (const entry of await readdir(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const outName = RENAME[entry.name] || entry.name;
    const dstPath = path.join(dstDir, outName);
    if (entry.isDirectory()) {
      await copyTemplate(srcPath, dstPath, tokens);
    } else {
      const content = await readFile(srcPath, "utf8");
      await writeFile(dstPath, applyTokens(content, tokens));
    }
  }
}
