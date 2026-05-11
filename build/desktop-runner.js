import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(__dirname);
const mode = process.argv[2] || "dev";
const extraArgs = process.argv.slice(3);

const env = {
  ...process.env,
  ELECTRON_CACHE: path.join(repoRoot, ".cache", "electron"),
  ELECTRON_BUILDER_CACHE: path.join(repoRoot, ".cache", "electron-builder"),
};

if (mode === "dev") {
  run(binName("electron"), ["."]);
} else if (mode === "rebuild") {
  run(binName("electron-builder"), ["install-app-deps"]);
} else if (mode === "dist") {
  const args = extraArgs.length ? extraArgs : [defaultCurrentPlatformFlag(), "--publish", "never"];
  run(binName("electron-builder"), args);
} else {
  console.error(`Unknown desktop runner mode: ${mode}`);
  process.exit(1);
}

function run(bin, args) {
  const child = spawn(bin, args, {
    cwd: repoRoot,
    env,
    stdio: "inherit",
    shell: false,
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
  child.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });
}

function binName(name) {
  if (process.platform === "win32") {
    return path.join(repoRoot, "node_modules", ".bin", `${name}.cmd`);
  }
  return path.join(repoRoot, "node_modules", ".bin", name);
}

function defaultCurrentPlatformFlag() {
  if (process.platform === "darwin") return "--mac";
  if (process.platform === "win32") return "--win";
  return "--linux";
}
