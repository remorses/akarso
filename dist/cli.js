#!/usr/bin/env node
// Bin entry for the akarso CLI. All command wiring lives in create-cli.ts
// so the website worker can import the same CLI without this file's
// Node-only side effects (createRequire, realpathSync).
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createCli } from "./create-cli.js";
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');
export const cli = createCli({ version: packageJson.version });
// Only parse when run directly (not when imported for docs generation).
// Uses realpathSync to handle symlinks (e.g. after npm install -g).
function isDirectRun() {
    if (!process.argv[1])
        return false;
    try {
        return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
    }
    catch {
        return false;
    }
}
if (isDirectRun()) {
    void cli.parse();
}
