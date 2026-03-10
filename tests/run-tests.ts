import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testsDir = path.dirname(fileURLToPath(import.meta.url));

async function collectTestFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectTestFiles(fullPath);
      }

      return entry.isFile() && entry.name.endsWith(".test.ts") ? [fullPath] : [];
    }),
  );

  return files.flat().sort();
}

const testFiles = await collectTestFiles(testsDir);

if (testFiles.length === 0) {
  console.error("No TypeScript test files were found in the tests directory.");
  process.exit(1);
}

const exitCode = await new Promise<number>((resolve, reject) => {
  const child = spawn(process.execPath, ["--import", "tsx", "--test", ...testFiles], {
    stdio: "inherit",
  });

  child.on("error", reject);
  child.on("close", (code, signal) => {
    if (signal) {
      reject(new Error(`Test process stopped by signal: ${signal}`));
      return;
    }

    resolve(code ?? 1);
  });
});

process.exit(exitCode);