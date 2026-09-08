import { expect } from "bun:test";

const gitLocalEnvironment = [
  "GIT_ALTERNATE_OBJECT_DIRECTORIES", "GIT_CONFIG", "GIT_CONFIG_PARAMETERS",
  "GIT_CONFIG_COUNT", "GIT_OBJECT_DIRECTORY", "GIT_DIR", "GIT_WORK_TREE",
  "GIT_IMPLICIT_WORK_TREE", "GIT_GRAFT_FILE", "GIT_INDEX_FILE",
  "GIT_NO_REPLACE_OBJECTS", "GIT_REPLACE_REF_BASE", "GIT_PREFIX",
  "GIT_SHALLOW_FILE", "GIT_COMMON_DIR",
];

export const repoRoot = process.cwd();
export const skillRoot = `${repoRoot}/skills/rrr`;

export function pythonCall(
  script: string,
  functionName: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
): unknown {
  const source = [
    "import importlib.util,json,sys",
    "spec=importlib.util.spec_from_file_location('rrr_module',sys.argv[1])",
    "module=importlib.util.module_from_spec(spec)",
    "spec.loader.exec_module(module)",
    "value=getattr(module,sys.argv[2])(*json.loads(sys.argv[3]),**json.loads(sys.argv[4]))",
    "print(json.dumps(value,sort_keys=True))",
  ].join(";");
  const process = Bun.spawnSync(
    ["python3", "-c", source, script, functionName, JSON.stringify(args), JSON.stringify(kwargs)],
    { stdout: "pipe", stderr: "pipe" },
  );
  expect(process.exitCode, new TextDecoder().decode(process.stderr)).toBe(0);
  return JSON.parse(new TextDecoder().decode(process.stdout));
}

export function run(
  command: string[],
  options: { cwd?: string; env?: Record<string, string | undefined> } = {},
) {
  const environment = options.env ? { ...process.env, ...options.env } : { ...process.env };
  if (command[0] === "git") {
    for (const name of gitLocalEnvironment) delete environment[name];
  }
  return Bun.spawnSync(command, {
    cwd: options.cwd,
    env: environment,
    stdout: "pipe",
    stderr: "pipe",
  });
}

export const stdout = (result: ReturnType<typeof Bun.spawnSync>) =>
  new TextDecoder().decode(result.stdout);
export const stderr = (result: ReturnType<typeof Bun.spawnSync>) =>
  new TextDecoder().decode(result.stderr);
